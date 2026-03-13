import { useState, useEffect } from 'react';
import { X, Download, Share, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

type PromptStep = 'install' | 'notifications' | 'ios-instructions' | null;

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY_INSTALL_DISMISSED = 'pwa_install_dismissed';
const STORAGE_KEY_NOTIF_DISMISSED = 'pwa_notif_dismissed';

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [step, setStep] = useState<PromptStep>(null);
    const [isIos, setIsIos] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const { subscribe, isSubscribed, permission } = usePushNotifications();

    useEffect(() => {
        // Detect iOS
        const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
        setIsIos(ios);

        // Detect standalone (already installed)
        const standalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone;
        setIsStandalone(standalone);

        // Android: listen for browser install prompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Only show if not previously dismissed
            const dismissed = localStorage.getItem(STORAGE_KEY_INSTALL_DISMISSED);
            if (!dismissed) {
                setStep('install');
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        // iOS: show prompt if not standalone and not dismissed
        if (ios && !standalone) {
            const dismissed = localStorage.getItem(STORAGE_KEY_INSTALL_DISMISSED);
            if (!dismissed) {
                // Slight delay for better UX
                const timer = setTimeout(() => setStep('ios-instructions'), 2000);
                return () => clearTimeout(timer);
            }
        }

        // If already installed (standalone) and notifications not yet requested
        if (standalone && !isSubscribed && permission === 'default') {
            const dismissed = localStorage.getItem(STORAGE_KEY_NOTIF_DISMISSED);
            if (!dismissed) {
                const timer = setTimeout(() => setStep('notifications'), 2000);
                return () => clearTimeout(timer);
            }
        }

        // Custom event to show prompt manually (from Profile button)
        const handleManualShow = () => {
             // Re-evaluate standalone state just in case
             const currentStandalone = window.matchMedia('(display-mode: standalone)').matches
                || (window.navigator as any).standalone;
             
             if (ios && !currentStandalone) {
                 setStep('ios-instructions');
             } else if (currentStandalone) {
                 toast.info("O app já está instalado no seu dispositivo!");
             } else {
                 setStep('install');
             }
        };

        window.addEventListener('show-pwa-install', handleManualShow);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('show-pwa-install', handleManualShow);
        };
    }, [isSubscribed, permission, isIos]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
            toast.success('App instalado com sucesso! 🎉');
            setStep('notifications'); // After installing, ask for notifications
        }
        setDeferredPrompt(null);
        if (choice.outcome === 'dismissed') {
            setStep(null);
        }
    };

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY_INSTALL_DISMISSED, 'true');
        setStep(null);
    };

    const handleEnableNotifications = async () => {
        const success = await subscribe();
        if (success) {
            toast.success('Notificações ativadas! Você receberá novidades do Clube das Brabas 🔔');
        } else {
            toast.error('Não foi possível ativar as notificações. Você pode ativá-las depois nas configurações.');
        }
        setStep(null);
        localStorage.setItem(STORAGE_KEY_NOTIF_DISMISSED, 'true');
    };

    const handleDismissNotifications = () => {
        localStorage.setItem(STORAGE_KEY_NOTIF_DISMISSED, 'true');
        setStep(null);
    };

    if (!step) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-slide-up">
            <div
                className="relative max-w-lg mx-auto rounded-2xl shadow-2xl border border-white/10"
                style={{ background: 'linear-gradient(135deg, #1A1F2C 0%, #252B3B 100%)' }}
            >
                {/* Close button */}
                <button
                    onClick={step === 'notifications' ? handleDismissNotifications : handleDismiss}
                    className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
                    aria-label="Fechar"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="p-5">
                    {/* ------- INSTALL BANNER (Android) ------- */}
                    {step === 'install' && (
                        <>
                            <div className="flex items-center gap-4 mb-4">
                                <img
                                    src="/icons/icon-192x192.png"
                                    alt="Clube das Brabas"
                                    className="w-14 h-14 rounded-xl shadow-lg"
                                />
                                <div>
                                    <h3 className="text-white font-bold text-lg leading-tight">Clube das Brabas</h3>
                                    <p className="text-white/60 text-sm">Adicionar à tela inicial</p>
                                </div>
                            </div>

                            <p className="text-white/80 text-sm mb-4 leading-relaxed">
                                Instale o app para acesso rápido, experiência offline e notificações em tempo real!
                            </p>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleInstall}
                                    className="flex-1 bg-[#ff4400] hover:bg-[#e03d00] text-white font-semibold"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Instalar App
                                </Button>
                                <Button
                                    onClick={handleDismiss}
                                    variant="ghost"
                                    className="text-white/60 hover:text-white hover:bg-white/10"
                                >
                                    Agora não
                                </Button>
                            </div>
                        </>
                    )}

                    {/* ------- iOS INSTRUCTIONS ------- */}
                    {step === 'ios-instructions' && (
                        <>
                            <div className="flex items-center gap-4 mb-4">
                                <img
                                    src="/icons/icon-192x192.png"
                                    alt="Clube das Brabas"
                                    className="w-14 h-14 rounded-xl shadow-lg"
                                />
                                <div>
                                    <h3 className="text-white font-bold text-lg leading-tight">Adicionar à Tela Inicial</h3>
                                    <p className="text-white/60 text-sm">Para iPhone e iPad</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-3 text-white/80 text-sm">
                                    <span className="bg-[#ff4400] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                    <span>Toque no ícone <Share className="inline h-4 w-4 text-blue-400" /> <strong>Compartilhar</strong> no Safari</span>
                                </div>
                                <div className="flex items-center gap-3 text-white/80 text-sm">
                                    <span className="bg-[#ff4400] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                    <span>Role para baixo e toque em <strong>"Adicionar à Tela Inicial"</strong></span>
                                </div>
                                <div className="flex items-center gap-3 text-white/80 text-sm">
                                    <span className="bg-[#ff4400] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                                    <span>Toque em <strong>"Adicionar"</strong> no canto superior direito</span>
                                </div>
                            </div>

                            <Button
                                onClick={handleDismiss}
                                variant="ghost"
                                className="w-full text-white/60 hover:text-white hover:bg-white/10"
                            >
                                Entendido
                            </Button>
                        </>
                    )}

                    {/* ------- NOTIFICATIONS PROMPT ------- */}
                    {step === 'notifications' && (
                        <>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-xl bg-[#ff4400]/20 flex items-center justify-center">
                                    <Bell className="h-7 w-7 text-[#ff4400]" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg leading-tight">Ativar Notificações</h3>
                                    <p className="text-white/60 text-sm">Fique por dentro de tudo!</p>
                                </div>
                            </div>

                            <p className="text-white/80 text-sm mb-4 leading-relaxed">
                                Receba avisos de novas publicações, respostas, eventos e conteúdos exclusivos diretamente no seu celular.
                            </p>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleEnableNotifications}
                                    className="flex-1 bg-[#ff4400] hover:bg-[#e03d00] text-white font-semibold"
                                >
                                    <Bell className="h-4 w-4 mr-2" />
                                    Ativar Notificações
                                </Button>
                                <Button
                                    onClick={handleDismissNotifications}
                                    variant="ghost"
                                    className="text-white/60 hover:text-white hover:bg-white/10"
                                >
                                    <BellOff className="h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
