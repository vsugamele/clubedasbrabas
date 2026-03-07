fetch("https://tkbivipqiewkfnhktmqq.supabase.co/functions/v1/auth-send-email", {
    method: 'POST',
    headers: {
        'x-supabase-signature': 'v1,whsec_AOY4IxZos2TOIm+dv0hpk3cLXOWo1RSAyEzzHmpeyMDMTckIFReWB4ImJy+rM1/AMKDLorZCKLyF13V2',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        user: { email: "vsugamele@gmail.com", user_metadata: {} },
        email_data: { email_action_type: "recovery", confirmation_url: "http://localhost:8080" }
    })
}).then(res => res.text()).then(console.log).catch(console.error);
