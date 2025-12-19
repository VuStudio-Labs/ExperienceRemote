import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onRoomCreated: (callback: (data: { roomCode: string; qrDataUrl: string; remoteUrl: string }) => void) => {
    ipcRenderer.on('room-created', (_, data) => callback(data));
  },

  onConnectionState: (callback: (state: string) => void) => {
    ipcRenderer.on('connection-state', (_, state) => callback(state));
  },

  getRoomData: () => ipcRenderer.invoke('get-room-data'),

  getSettings: () => ipcRenderer.invoke('get-settings'),

  updateOscSettings: (settings: { host: string; port: number }) =>
    ipcRenderer.invoke('update-osc-settings', settings),

  regenerateRoom: () => ipcRenderer.invoke('regenerate-room'),
});
