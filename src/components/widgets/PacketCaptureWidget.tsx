import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Input, Checkbox, Alert, Spinner, Table, Badge } from '@/components/ui';
import { DownloadIcon, PlayIcon, StopIcon, PauseIcon, TrashIcon, FilterIcon } from '@/components/icons';
import { NDRIntegrationService } from '@/services/NDRIntegrationService';
import { useTheme } from '@/hooks/useTheme';
import { usePermissions } from '@/hooks/usePermissions';
import { TimeRange } from '@/types/analytics';
import { logger } from '@/utils/logger';
import './PacketCaptureWidget.scss';

interface PacketCaptureWidgetProps {
  timeRange: TimeRange;
  className?: string;
}

const PacketCaptureWidget: React.FC<PacketCaptureWidgetProps> = ({
  timeRange,
  className = ''
}) => {
  const { theme } = useTheme();
  const { hasPermission } = usePermissions();
  
  // State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [interfaces, setInterfaces] = useState<any[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<string>('');
  const [filter, setFilter] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captureOptions, setCaptureOptions] = useState<{
    maxSize: number;
    maxTime: number;
    includeHeaders: boolean;
    saveToFile: boolean;
  }>({
    maxSize: 100,
    maxTime: 60,
    includeHeaders: true,
    saveToFile: true
  });
  
  // Check if user has capture permission
  const canCapture = hasPermission('capture:packets');
  
  // Load available network interfaces
  useEffect(() => {
    const fetchInterfaces = async () => {
      try {
        // API çağrısı ile ağ arayüzlerini çek (henüz API endpoint tanımlı değil)
        // Gerçek bir API olana kadar örnek veriler kullanabiliriz
        setInterfaces([
          { id: 'eth0', name: 'eth0 (WAN)' },
          { id: 'eth1', name: 'eth1 (LAN)' },
          { id: 'any', name: 'any (Tüm Arayüzler)' }
        ]);
        setSelectedInterface('any');
      } catch (err) {
        logger.error('Error fetching network interfaces:', err);
        setError('Ağ arayüzleri alınamadı. Lütfen tekrar deneyin.');
      }
    };
    
    fetchInterfaces();
  }, []);
  
  // Load previous capture sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        // API çağrısı ile önceki oturumları çek (henüz API endpoint tanımlı değil)
        // Gerçek bir API olana kadar örnek veriler kullanabiliriz
        const mockSessions = [
          {
            id: 'capture_1',
            interface: 'eth0',
            startTime: new Date(Date.now() - 3600000).toISOString(),
            endTime: new Date(Date.now() - 3500000).toISOString(),
            packets: 1523,
            size: 2.4 * 1024 * 1024,
            filter: 'host 192.168.1.1',
            status: 'completed'
          },
          {
            id: 'capture_2',
            interface: 'any',
            startTime: new Date(Date.now() - 1800000).toISOString(),
            endTime: new Date(Date.now() - 1700000).toISOString(),
            packets: 853,
            size: 1.2 * 1024 * 1024,
            filter: 'port 80 or port 443',
            status: 'completed'
          },
          {
            id: 'capture_3',
            interface: 'eth1',
            startTime: new Date(Date.now() - 300000).toISOString(),
            endTime: null,
            packets: 245,
            size: 0.5 * 1024 * 1024,
            filter: '',
            status: 'running'
          }
        ];
        
        setSessions(mockSessions);
        
        // Hala çalışan bir oturum varsa state'i güncelle
        const runningSession = mockSessions.find(s => s.status === 'running');
        if (runningSession) {
          setIsCapturing(true);
          setSelectedInterface(runningSession.interface);
          setFilter(runningSession.filter || '');
        }
      } catch (err) {
        logger.error('Error fetching capture sessions:', err);
        setError('Önceki yakalama oturumları alınamadı. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessions();
  }, [timeRange]);
  
  // Handle capture start
  const handleStartCapture = async () => {
    if (!canCapture) {
      setError('Paket yakalama işlemi için yetkiniz bulunmuyor.');
      return;
    }
    
    try {
      setLoading(true);
      
      // API çağrısı ile yakalamayı başlat (henüz API endpoint tanımlı değil)
      // const response = await NDRIntegrationService.startPacketCapture({
      //   interface: selectedInterface,
      //   filter: filter,
      //   maxSize: captureOptions.maxSize,
      //   maxTime: captureOptions.maxTime,
      //   includeHeaders: captureOptions.includeHeaders,
      //   saveToFile: captureOptions.saveToFile
      // });
      
      // Simüle edilmiş başarılı yanıt
      const newSession = {
        id: `capture_${Date.now()}`,
        interface: selectedInterface,
        startTime: new Date().toISOString(),
        endTime: null,
        packets: 0,
        size: 0,
        filter: filter,
        status: 'running'
      };
      
      // Oturumları güncelle
      setSessions([newSession, ...sessions]);
      setIsCapturing(true);
      setError(null);
    } catch (err) {
      logger.error('Error starting packet capture:', err);
      setError('Paket yakalama başlatılamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle capture stop
  const handleStopCapture = async () => {
    try {
      setLoading(true);
      
      // Çalışan oturumu bul
      const runningSessionIndex = sessions.findIndex(s => s.status === 'running');
      if (runningSessionIndex === -1) {
        setError('Aktif yakalama oturumu bulunamadı.');
        return;
      }
      
      // API çağrısı ile yakalamayı durdur (henüz API endpoint tanımlı değil)
      // const response = await NDRIntegrationService.stopPacketCapture(sessions[runningSessionIndex].id);
      
      // Simüle edilmiş başarılı yanıt
      const updatedSessions = [...sessions];
      updatedSessions[runningSessionIndex] = {
        ...updatedSessions[runningSessionIndex],
        endTime: new Date().toISOString(),
        packets: 458, // Simüle edilmiş paket sayısı
        size: 1.3 * 1024 * 1024, // Simüle edilmiş boyut
        status: 'completed'
      };
      
      // Oturumları güncelle
      setSessions(updatedSessions);
      setIsCapturing(false);
      setError(null);
    } catch (err) {
      logger.error('Error stopping packet capture:', err);
      setError('Paket yakalama durdurulamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle capture pause/resume
  const handlePauseResumeCapture = async () => {
    // Uygulamada bu özellik varsa buraya eklenebilir
  };
  
  // Handle PCAP download
  const handleDownloadPcap = async (sessionId: string) => {
    try {
      setLoading(true);
      
      // API çağrısı ile PCAP dosyasını indir (henüz API endpoint tanımlı değil)
      // const pcapBlob = await NDRIntegrationService.downloadPcap(sessionId);
      
      // Simüle edilmiş indirme işlemi
      setTimeout(() => {
        setLoading(false);
        
        // Gerçek indirme olmayacak, sadece alert gösterilecek
        alert(`PCAP dosyası indiriliyor: ${sessionId}.pcap`);
      }, 1000);
    } catch (err) {
      logger.error('Error downloading PCAP:', err);
      setError('PCAP dosyası indirilemedi. Lütfen tekrar deneyin.');
      setLoading(false);
    }
  };
  
  // Handle session delete
  const handleDeleteSession = async (sessionId: string) => {
    try {
      setLoading(true);
      
      // API çağrısı ile oturumu sil (henüz API endpoint tanımlı değil)
      // await NDRIntegrationService.deletePacketCaptureSession(sessionId);
      
      // Simüle edilmiş silme işlemi
      setSessions(sessions.filter(s => s.id !== sessionId));
      setError(null);
    } catch (err) {
      logger.error('Error deleting capture session:', err);
      setError('Yakalama oturumu silinemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  };
  
  // Format time
  const formatTime = (isoString: string): string => {
    if (!isoString) return 'Devam ediyor';
    return new Date(isoString).toLocaleString();
  };
  
  // Format duration
  const formatDuration = (startTime: string, endTime: string | null): string => {
    if (!endTime) return 'Devam ediyor';
    
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <Card 
      className={`packet-capture-widget ${theme} ${className}`}
      title="Paket Yakalama"
      titleIcon={<DownloadIcon />}
    >
      {!canCapture ? (
        <Alert 
          type="warning" 
          title="Yetki Gerekiyor" 
          message="Paket yakalama işlemi için gerekli yetkilere sahip değilsiniz."
        />
      ) : (
        <div className="packet-capture-widget__content">
          {error && (
            <Alert 
              type="error" 
              title="Hata" 
              message={error}
              className="packet-capture-widget__error"
            />
          )}
          
          <div className="packet-capture-widget__capture-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="interface">Ağ Arayüzü</label>
                <Select
                  id="interface"
                  value={selectedInterface}
                  onChange={(value) => setSelectedInterface(value)}
                  options={interfaces.map(iface => ({
                    value: iface.id,
                    label: iface.name
                  }))}
                  disabled={isCapturing || loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="filter">BPF Filtresi (Opsiyonel)</label>
                <div className="filter-input">
                  <Input
                    id="filter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="örn: host 192.168.1.1 and port 80"
                    disabled={isCapturing || loading}
                  />
                  <Button 
                    icon={<FilterIcon />}
                    variant="secondary"
                    disabled={isCapturing || loading}
                    title="Filtre Yardımı"
                    onClick={() => alert('BPF Filtre Yardımı')}
                  />
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="max-size">Maksimum Boyut (MB)</label>
                <Input
                  id="max-size"
                  type="number"
                  min={1}
                  max={1000}
                  value={captureOptions.maxSize.toString()}
                  onChange={(e) => setCaptureOptions({
                    ...captureOptions,
                    maxSize: parseInt(e.target.value) || 100
                  })}
                  disabled={isCapturing || loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="max-time">Maksimum Süre (saniye)</label>
                <Input
                  id="max-time"
                  type="number"
                  min={1}
                  max={3600}
                  value={captureOptions.maxTime.toString()}
                  onChange={(e) => setCaptureOptions({
                    ...captureOptions,
                    maxTime: parseInt(e.target.value) || 60
                  })}
                  disabled={isCapturing || loading}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group checkbox-group">
                <Checkbox
                  id="include-headers"
                  checked={captureOptions.includeHeaders}
                  onChange={(e) => setCaptureOptions({
                    ...captureOptions,
                    includeHeaders: e.target.checked
                  })}
                  disabled={isCapturing || loading}
                  label="Tüm paket başlıklarını dahil et"
                />
              </div>
              
              <div className="form-group checkbox-group">
                <Checkbox
                  id="save-to-file"
                  checked={captureOptions.saveToFile}
                  onChange={(e) => setCaptureOptions({
                    ...captureOptions,
                    saveToFile: e.target.checked
                  })}
                  disabled={isCapturing || loading}
                  label="Dosyaya kaydet"
                />
              </div>
            </div>
            
            <div className="form-actions">
              {!isCapturing ? (
                <Button
                  variant="primary"
                  icon={<PlayIcon />}
                  onClick={handleStartCapture}
                  disabled={loading || !selectedInterface}
                  loading={loading}
                >
                  Yakalamayı Başlat
                </Button>
              ) : (
                <Button
                  variant="danger"
                  icon={<StopIcon />}
                  onClick={handleStopCapture}
                  disabled={loading}
                  loading={loading}
                >
                  Yakalamayı Durdur
                </Button>
              )}
            </div>
          </div>
          
          <div className="packet-capture-widget__sessions">
            <h4 className="section-title">Yakalama Oturumları</h4>
            
            {loading && sessions.length === 0 ? (
              <div className="loading-container">
                <Spinner size="medium" />
                <p>Yakalama oturumları yükleniyor...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="empty-container">
                <p>Herhangi bir yakalama oturumu bulunamadı.</p>
              </div>
            ) : (
              <Table
                columns={[
                  { id: 'interface', header: 'Arayüz', cell: (row) => row.interface },
                  { id: 'startTime', header: 'Başlangıç', cell: (row) => formatTime(row.startTime) },
                  { id: 'duration', header: 'Süre', cell: (row) => formatDuration(row.startTime, row.endTime) },
                  { id: 'packets', header: 'Paketler', cell: (row) => row.packets.toLocaleString() },
                  { id: 'size', header: 'Boyut', cell: (row) => formatSize(row.size) },
                  { 
                    id: 'status', 
                    header: 'Durum', 
                    cell: (row) => (
                      <Badge 
                        color={row.status === 'running' ? 'success' : 'default'}
                      >
                        {row.status === 'running' ? 'Aktif' : 'Tamamlandı'}
                      </Badge>
                    ) 
                  },
                  { 
                    id: 'actions', 
                    header: 'İşlemler', 
                    cell: (row) => (
                      <div className="table-actions">
                        <Button
                          variant="icon"
                          icon={<DownloadIcon />}
                          onClick={() => handleDownloadPcap(row.id)}
                          disabled={row.status === 'running' || loading}
                          title="PCAP İndir"
                        />
                        <Button
                          variant="icon"
                          icon={<TrashIcon />}
                          onClick={() => handleDeleteSession(row.id)}
                          disabled={row.status === 'running' || loading}
                          title="Oturumu Sil"
                        />
                      </div>
                    ) 
                  }
                ]}
                data={sessions}
                className="sessions-table"
              />
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default PacketCaptureWidget;