/**
 * Este arquivo serve como um polyfill para os módulos Capacitor 
 * durante o desenvolvimento web, garantindo que o aplicativo não
 * quebre quando os recursos nativos não estiverem disponíveis.
 */

// Polyfill básico para o Capacitor
if (typeof window !== 'undefined' && !window.Capacitor) {
  // @ts-ignore
  window.Capacitor = {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
    Plugins: {}
  };
}

// Exporta funções vazias para os serviços nativos
// Isso permite importar normalmente sem erros

export const createPolyfill = (methodNames: string[]) => {
  const obj: Record<string, any> = {};
  
  methodNames.forEach(method => {
    obj[method] = async (...args: any[]) => {
      console.log(`Método nativo chamado em ambiente web: ${method}`, args);
      return null;
    };
  });
  
  return obj;
};

// Polyfills para os diferentes plugins
if (typeof window !== 'undefined') {
  const plugins = [
    'Preferences',
    'Network',
    'LocalNotifications',
    'PushNotifications',
    'Camera',
    'Share',
    'SplashScreen',
    'StatusBar'
  ];
  
  plugins.forEach(plugin => {
    if (!window.Capacitor.Plugins[plugin]) {
      window.Capacitor.Plugins[plugin] = createPolyfill([
        'get', 'set', 'remove', 'clear', 'keys',
        'getStatus', 'addListener',
        'requestPermissions', 'checkPermissions',
        'register', 'getDeliveredNotifications',
        'schedule', 'cancel', 'getPending',
        'getPhoto', 'pickImages',
        'share', 'canShare',
        'hide', 'show'
      ]);
    }
  });
}

declare global {
  interface Window {
    Capacitor: {
      isNativePlatform: () => boolean;
      getPlatform: () => string;
      Plugins: Record<string, any>;
    };
  }
}
