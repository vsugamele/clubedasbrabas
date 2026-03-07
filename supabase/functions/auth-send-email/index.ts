import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const payloadBuffer = await req.text()
    const headers = Object.fromEntries(req.headers)

    let payload;
    try {
      payload = JSON.parse(payloadBuffer)
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError)
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const { user, email_data } = payload
    console.log("Evento Auth Recebido via Webhook:", payload)

    // O Supabase Auth Hook envia token_hash e etc, mas não a URL final pronta. Nós mesmos construímos:
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://tkbivipqiewkfnhktmqq.supabase.co'

    // Fallback inteligente: se não vier redirect_to, usa o site_url. Para recovery, garante que vá para /reset-password
    let fallbackUrl = email_data.site_url || 'http://localhost:8080'
    if (email_data.email_action_type === 'recovery' && !fallbackUrl.includes('reset-password')) {
      fallbackUrl = `${fallbackUrl.replace(/\/$/, '')}/reset-password`
    }
    const redirectTo = email_data.redirect_to || fallbackUrl

    const params = new URLSearchParams({
      token: email_data.token_hash,
      type: email_data.email_action_type,
      redirect_to: redirectTo,
    })
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?${params.toString()}`

    // Lógica Multi-Tenant baseada no metadata do usuário
    const userDomain = user.user_metadata?.project_domain || 'clubedasbrabas.com.br'

    let fromEmail = 'Clube das Brabas <contato@clubedasbrabas.com.br>'
    let subject = 'Lembrete de Acesso'

    if (userDomain === 'projetodois.com.br') {
      fromEmail = 'Projeto Dois <contato@projetodois.com.br>'
    }

    // Templating de acordo com o Tipo da Ação (email_action_type)
    let htmlTemplate = ''
    if (email_data.email_action_type === 'recovery') {
      subject = 'Recuperação de Senha'
      htmlTemplate = `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; text-align: center;">
          <h2 style="color: #333;">Recuperação de Senha</h2>
          <p style="color: #666; margin-bottom: 20px;">Você solicitou a redefinição de segurança da sua senha. Clique no botão abaixo para criar uma nova senha:</p>
          <a href="${confirmationUrl}" style="background: #E81A5D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Redefinir Senha
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">Se você não solicitou isso, apenas ignore este e-mail.</p>
        </div>
      `
    } else if (email_data.email_action_type === 'signup') {
      subject = 'Confirme sua Conta'
      htmlTemplate = `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; text-align: center;">
          <h2 style="color: #333;">Bem-vindo(a)!</h2>
          <p style="color: #666; margin-bottom: 20px;">Falta apenas um passo para finalizar seu cadastro. Por favor, confirme seu endereço de e-mail clicando no botão abaixo:</p>
          <a href="${confirmationUrl}" style="background: #E81A5D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Confirmar Conta
          </a>
        </div>
      `
    } else if (email_data.email_action_type === 'magiclink') {
      subject = 'Seu Magic Link de Acesso'
      htmlTemplate = `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; text-align: center;">
          <h2 style="color: #333;">Acesso Rápido</h2>
          <p style="color: #666; margin-bottom: 20px;">Use o botão mágico abaixo para entrar na sua conta sem precisar de senha:</p>
          <a href="${confirmationUrl}" style="background: #E81A5D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Entrar Automaticamente
          </a>
        </div>
      `
    } else {
      // Fallback para tipos de e-mail não especificados (ex: mudança de e-mail)
      htmlTemplate = `<p>Acesse o link a seguir para confirmar essa ação técnica: <a href="${confirmationUrl}">${confirmationUrl}</a></p>`
    }

    // Disparar usando Resend
    const resendResponse = await resend.emails.send({
      from: fromEmail,
      to: [user.email],
      subject: subject,
      html: htmlTemplate,
      text: `Para confirmar a ação, copie e cole este link no seu navegador: ${confirmationUrl}`
    })

    if (resendResponse.error) {
      throw new Error(resendResponse.error.message)
    }

    return new Response(JSON.stringify(resendResponse.data), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error("Erro no Auth Hook:", error)
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
