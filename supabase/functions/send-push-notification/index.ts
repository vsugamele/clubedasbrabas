import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Simple Web Push without external library
async function sendWebPush(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string,
    vapidPrivateKey: string,
    vapidPublicKey: string,
    vapidEmail: string
): Promise<boolean> {
    const base64ToBuffer = (base64: string): ArrayBuffer => {
        const padding = '='.repeat((4 - base64.length % 4) % 4);
        const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
        const binaryString = atob(b64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    };

    const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        base64ToBuffer(vapidPrivateKey),
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign']
    );

    const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const expiry = Math.floor(Date.now() / 1000) + 12 * 3600;
    const claims = btoa(JSON.stringify({ aud: audience, exp: expiry, sub: vapidEmail }))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const sigInput = new TextEncoder().encode(`${header}.${claims}`);
    const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, sigInput);
    const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const jwt = `${header}.${claims}.${sigBase64}`;

    const response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `vapid t=${jwt},k=${vapidPublicKey}`,
            'Content-Type': 'application/json',
            'TTL': '60',
        },
        body: payload,
    });

    return response.ok || response.status === 201;
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const body = await req.json();
        const { user_id, title, message, url, image } = body;

        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
        const vapidEmail = Deno.env.get('VAPID_EMAIL') ?? 'mailto:admin@clubedasbrabas.com';

        if (!vapidPublicKey || !vapidPrivateKey) {
            return new Response(
                JSON.stringify({ error: 'VAPID keys not configured' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        let query = supabaseClient.from('c_push_subscriptions').select('user_id, subscription');
        if (user_id) {
            query = query.eq('user_id', user_id);
        }
        const { data: subscriptions, error } = await query;

        if (error) {
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const payload = JSON.stringify({
            title: title || 'Clube das Brabas',
            body: message || 'Você tem uma nova notificação!',
            url: url || '/',
            image,
        });

        const results = await Promise.allSettled(
            (subscriptions || []).map(async (sub: any) => {
                return sendWebPush(
                    sub.subscription as any,
                    payload,
                    vapidPrivateKey,
                    vapidPublicKey,
                    vapidEmail
                );
            })
        );

        const sent = results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<boolean>).value).length;
        const failed = results.length - sent;

        return new Response(
            JSON.stringify({ success: true, sent, failed, total: results.length }),
            { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: String(err) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
