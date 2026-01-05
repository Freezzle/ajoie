(window as any).global = window;
import('./bootstrap').catch(err => console.error(err));