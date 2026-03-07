import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// VAPID public key — must match the private VAPID key stored in Supabase secrets
const VAPID_PUBLIC_KEY = 'BDvhYaQAd-qkLIKiP2QHKRAQ0UNL8ZQbktnFqVNt_BK9s8F4xL6ng-3d9xb2A5eXYgygIC7DJKjFTCdwbUWZfZI';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export type NotificationPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export function usePushNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!('Notification' in window)) {
            setPermission('unsupported');
            return;
        }
        setPermission(Notification.permission as NotificationPermission);

        // Check if already subscribed
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(async (registration) => {
                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
            });
        }
    }, []);

    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications are not supported in this browser');
            return false;
        }

        setIsLoading(true);
        try {
            // Request notification permission
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult as NotificationPermission);

            if (permissionResult !== 'granted') {
                setIsLoading(false);
                return false;
            }

            // Get service worker registration
            const registration = await navigator.serviceWorker.ready;

            // Subscribe to push notifications
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoading(false);
                return false;
            }

            // Save subscription to database
            const subscriptionJson = subscription.toJSON();
            const { error } = await supabase
                .from('c_push_subscriptions' as any)
                .upsert({
                    user_id: user.id,
                    subscription: subscriptionJson,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id',
                });

            if (error) {
                console.error('Error saving push subscription:', error);
                setIsLoading(false);
                return false;
            }

            setIsSubscribed(true);
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
            setIsLoading(false);
            return false;
        }
    }, []);

    const unsubscribe = useCallback(async (): Promise<boolean> => {
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Remove from database
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase
                        .from('c_push_subscriptions' as any)
                        .delete()
                        .eq('user_id', user.id);
                }
            }

            setIsSubscribed(false);
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error('Error unsubscribing:', error);
            setIsLoading(false);
            return false;
        }
    }, []);

    return {
        permission,
        isSubscribed,
        isLoading,
        subscribe,
        unsubscribe,
        isSupported: 'Notification' in window && 'serviceWorker' in navigator,
    };
}
