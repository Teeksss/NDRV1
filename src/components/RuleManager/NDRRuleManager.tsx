import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Card, 
  Tabs, 
  Tab, 
  Table, 
  Button, 
  SearchInput, 
  Select, 
  Modal, 
  Spinner, 
  Alert,
  Badge,
  Checkbox,
  Tooltip,
  Input,
  TextArea
} from '@/components/ui';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  RefreshIcon,
  ImportIcon,
  ExportIcon,
  CopyIcon,
  PlayIcon,
  StopIcon,
  InfoIcon
} from '@/components/icons';
import { RuleService } from '@/services/RuleService';
import { ruleActions } from '@/store/rules/actions';
import { RootState } from '@/store/types';
import { formatDate } from '@/utils/formatters';
import { usePermissions } from '@/hooks/usePermissions';
import { logger } from '@/utils/logger';
import './NDRRuleManager.scss';

interface Rule {
  id: string;
  name: string;
  description: string;
  type: 'zeek' | 'suricata' | 'sigma' | 'yara' | 'custom';
  category: string;
  content: string;
  enabled: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastTriggeredAt?: string;
  triggerCount: number;
  version: number;
}

interface RuleManagerProps {
  className?: string;
}

const NDRRuleManager: React.FC<RuleManagerProps> = ({ className = '' }) => {
  // State
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmMessage, setConfirmMessage] = useState<string>('');
  
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  
  const [editedRule, setEditedRule] = useState<Partial<Rule>>({});
  
  // Redux
  const dispatch = useDispatch();
  const { rules, loading, error } = useSelector((state: RootState) => state.rules);
  
  // Permissions
  const { hasPermission } = usePermissions();
  const canCreateRules = hasPermission('rules:create');
  const canEditRules = hasPermission('rules:edit');
  const canDeleteRules = hasPermission('rules:delete');
  const canEnableRules = hasPermission('rules:enable');
  
  // Load rules on component mount
  useEffect(() => {
    dispatch(ruleActions.fetchRules());
  }, [dispatch]);
  
  // Filter rules based on active tab and filters
  const filteredRules = rules.filter(rule => {
    // Filter by tab
    if (activeTab !== 'all' && rule.type !== activeTab) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery && !rule.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !rule.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !rule.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    
    // Filter by type
    if (typeFilter !== 'all' && rule.type !== typeFilter) {
      return false;
    }
    
    // Filter by severity
    if (severityFilter !== 'all' && rule.severity !== severityFilter) {
      return false;
    }
    
    // Filter by status
    if (statusFilter === 'enabled' && !rule.enabled) {
      return false;
    }
    if (statusFilter === 'disabled' && rule.enabled) {
      return false;
    }
    
    return true;
  });
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  // Handle rule click
  const handleRuleClick = (rule: Rule) => {
    setSelectedRule(rule);
    setModalMode('view');
    setShowRuleModal(true);
  };
  
  // Handle create rule
  const handleCreateRule = () => {
    setSelectedRule(null);
    setEditedRule({
      name: '',
      description: '',
      type: 'custom',
      category: '',
      content: '',
      enabled: true,
      severity: 'medium',
      tags: []
    });
    setModalMode('create');
    setShowRuleModal(true);
  };
  
  // Handle edit rule
  const handleEditRule = (rule: Rule) => {
    setSelectedRule(rule);
    setEditedRule({ ...rule });
    setModalMode('edit');
    setShowRuleModal(true);
  };
  
  // Handle delete rule
  const handleDeleteRule = (rule: Rule) => {
    setSelectedRule(rule);
    setConfirmMessage(`'${rule.name}' kuralını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`);
    setConfirmAction(() => () => {
      dispatch(ruleActions.deleteRule(rule.id));
      setShowConfirmModal(false);
    });
    setShowConfirmModal(true);
  };
  
  // Handle toggle rule
  const handleToggleRule = (rule: Rule) => {
    const action = rule.enabled ? 'devre dışı bırakmak' : 'etkinleştirmek';
    setSelectedRule(rule);
    setConfirmMessage(`'${rule.name}' kuralını ${action} istediğinizden emin misiniz?`);
    setConfirmAction(() => () => {
      dispatch(ruleActions.updateRule(rule.id, { enabled: !rule.enabled }));
      setShowConfirmModal(false);
    });
    setShowConfirmModal(true);
  };
  
  // Handle duplicate rule
  const handleDuplicateRule = (rule: Rule) => {
    setSelectedRule(null);
    const newRule = {
      ...rule,
      id: undefined,
      name: `${rule.name} (Copy)`,
      enabled: false
    };
    setEditedRule(newRule);
    setModalMode('create');
    setShowRuleModal(true);
  };
  
  // Handle save rule
  const handleSaveRule = () => {
    if (!editedRule.name || !editedRule.content) {
      // Show validation error
      return;
    }
    
    if (modalMode === 'create') {
      dispatch(ruleActions.createRule(editedRule));
    } else if (modalMode === 'edit' && selectedRule) {
      dispatch(ruleActions.updateRule(selectedRule.id, editedRule));
    }
    
    setShowRuleModal(false);
  };
  
  // Handle import rules
  const handleImportRules = () => {
    setImportFile(null);
    setImportError(null);
    setShowImportModal(true);
  };
  
  // Handle export rules
  const handleExportRules = () => {
    try {
      const exportData = filteredRules.map(rule => ({
        name: rule.name,
        description: rule.description,
        type: rule.type,
        category: rule.category,
        content: rule.content,
        enabled: rule.enabled,
        severity: rule.severity,
        tags: rule.tags
      }));
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ndr-rules-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Error exporting rules:', error);
      // Show error notification
    }
  };
  
  // Handle import file upload
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
      setImportError(null);
    }
  };
  
  // Handle import submit
  const handleImportSubmit = async () => {
    if (!importFile) {
      setImportError('Lütfen bir dosya seçin');
      return;
    }
    
    try {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const fileContent = e.target?.result as string;
          const rules = JSON.parse(fileContent);
          
          if (!Array.isArray(rules)) {
            setImportError('Geçersiz dosya formatı. JSON dizisi bekleniyor.');
            return;
          }
          
          // Import rules
          dispatch(ruleActions.importRules(rules));
          setShowImportModal(false);
        } catch (error) {
          logger.error('Error parsing import file:', error);
          setImportError('Dosya ayrıştırılırken hata oluştu. Geçerli bir JSON dosyası olduğundan emin olun.');
        }
      };
      
      fileReader.readAsText(importFile);
    } catch (error) {
      logger.error('Error reading import file:', error);
      setImportError('Dosya okunurken hata oluştu.');
    }
  };
  
  // Render rule severity badge
  const renderSeverityBadge = (severity: string) => {
    const color = 
      severity === 'critical' ? 'danger' :
      severity === 'high' ? 'warning' :
      severity === 'medium' ? 'caution' :
      'info';
    
    return (
      <Badge color={color}>
        {severity === 'critical' ? 'Kritik' :
         severity === 'high' ? 'Yüksek' :
         severity === 'medium' ? 'Orta' :
         'Düşük'}
      </Badge>
    );
  };
  
  return (
    <div className={`ndr-rule-manager ${className}`}>
      <Card
        title="NDR Kural Yöneticisi"
        titleIcon={<InfoIcon />}
        actions={
          <>
            <SearchInput
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
              placeholder="Kural ara..."
              className="search-input"
            />
            
            <Select
              value={typeFilter}
              onChange={(value) => setTypeFilter(value)}
              options={[
                { value: 'all', label: 'Tüm Tipler' },
                { value: 'zeek', label: 'Zeek' },
                { value: 'suricata', label: 'Suricata' },
                { value: 'sigma', label: 'Sigma' },
                { value: 'yara', label: 'YARA' },
                { value: 'custom', label: 'Özel' }
              ]}
              label="Tip"
            />
            
            <Select
              value={severityFilter}
              onChange={(value) => setSeverityFilter(value)}
              options={[
                { value: 'all', label: 'Tüm Önemler' },
                { value: 'critical', label: 'Kritik' },
                { value: 'high', label: 'Yüksek' },
                { value: 'medium', label: 'Orta' },
                { value: 'low', label: 'Düşük' }
              ]}
              label="Önem"
            />
            
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { value: 'all', label: 'Tüm Durumlar' },
                { value: 'enabled', label: 'Etkin' },
                { value: 'disabled', label: 'Devre Dışı' }
              ]}
              label="Durum"
            />
            
            <div className="action-buttons">
              {canCreateRules && (
                <Button
                  variant="primary"
                  icon={<PlusIcon />}
                  onClick={handleCreateRule}
                >
                  Kural Ekle
                </Button>
              )}
              
              <Button
                variant="secondary"
                icon={<ImportIcon />}
                onClick={handleImportRules}
              >
                İçe Aktar
              </Button>
              
              <Button
                variant="secondary"
                icon={<ExportIcon />}
                onClick={handleExportRules}
                disabled={filteredRules.length === 0}
              >
                Dışa Aktar
              </Button>
              
              <Button
                variant="icon"
                icon={<RefreshIcon />}
                onClick={() => dispatch(ruleActions.fetchRules())}
                aria-label="Yenile"
                title="Yenile"
                loading={loading}
              />
            </div>
          </>
        }
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          className="rule-tabs"
        >
          <Tab value="all" label="Tüm Kurallar" />
          <Tab value="zeek" label="Zeek" />
          <Tab value="suricata" label="Suricata" />
          <Tab value="sigma" label="Sigma" />
          <Tab value="yara" label="YARA" />
          <Tab value="custom" label="Özel" />
        </Tabs>
        
        {loading && rules.length === 0 ? (
          <div className="loading-container">
            <Spinner size="large" />
            <p>Kurallar yükleniyor...</p>
          </div>
        ) : error ? (
          <Alert
            type="error"
            title="Yükleme Hatası"
            message={error}
            action={
              <Button onClick={() => dispatch(ruleActions.fetchRules())}>
                Yeniden Dene
              </Button>
            }
          />
        ) : filteredRules.length === 0 ? (
          <div className="empty-container">
            <p>Bu kriterlere uygun kural bulunamadı.</p>
            <Button
              variant="primary"
              onClick={handleCreateRule}
              disabled={!canCreateRules}
            >
              Yeni Kural Oluştur
            </Button>
          </div>
        ) : (
          <Table
            columns={[
              { id: 'name', header: 'İsim', cell: (row) => row.name },
              { id: 'description', header: 'Açıklama', cell: (row) => row.description },
              { id: 'type', header: 'Tip', cell: (row) => row.type },
              { 
                id: 'severity', 
                header: 'Önem', 
                cell: (row) => renderSeverityBadge(row.severity) 
              },
              { 
                id: 'status', 
                header: 'Durum', 
                cell: (row) => (
                  <Badge color={row.enabled ? 'success' : 'default'}>
                    {row.enabled ? 'Etkin' : 'Devre Dışı'}
                  </Badge>
                ) 
              },
              { id: 'updated', header: 'Güncelleme', cell: (row) => formatDate(row.updatedAt) },
              { 
                id: 'actions', 
                header: 'İşlemler', 
                cell: (row) => (
                  <div className="rule-actions">
                    {canEnableRules && (
                      <Tooltip content={row.enabled ? 'Devre Dışı Bırak' : 'Etkinleştir'}>
                        <Button
                          variant="icon"
                          icon={row.enabled ? <StopIcon /> : <PlayIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRule(row);
                          }}
                        />
                      </Tooltip>
                    )}
                    
                    {canEditRules && (
                      <Tooltip content="Düzenle">
                        <Button
                          variant="icon"
                          icon={<EditIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRule(row);
                          }}
                        />
                      </Tooltip>
                    )}
                    
                    <Tooltip content="Kopyala">
                      <Button
                        variant="icon"
                        icon={<CopyIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateRule(row);
                        }}
                      />
                    </Tooltip>
                    
                    {canDeleteRules && (
                      <Tooltip content="Sil">
                        <Button
                          variant="icon"
                          icon={<TrashIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRule(row);
                          }}
                          className="delete-button"
                        />
                      </Tooltip>
                    )}
                  </div>
                ) 
              }
            ]}
            data={filteredRules}
            onRowClick={handleRuleClick}
            className="rules-table"
            hoverable
            pagination={{
              pageSize: 10,
              total: filteredRules.length
            }}
          />
        )}
      </Card>
      
      {/* Rule Detail/Edit Modal */}
      <Modal
        isOpen={showRuleModal}
        onClose={() => setShowRuleModal(false)}
        title={
          modalMode === 'view' ? 'Kural Detayları' :
          modalMode === 'edit' ? 'Kuralı Düzenle' :
          'Yeni Kural Oluştur'
        }
        size="large"
        actions={
          modalMode === 'view' ? [
            <Button key="close" onClick={() => setShowRuleModal(false)}>
              Kapat
            </Button>,
            canEditRules && (
              <Button 
                key="edit" 
                variant="primary"
                onClick={() => {
                  setEditedRule(selectedRule!);
                  setModalMode('edit');
                }}
              >
                Düzenle
              </Button>
            )
          ] : [
            <Button key="cancel" onClick={() => setShowRuleModal(false)}>
              İptal
            </Button>,
            <Button 
              key="save" 
              variant="primary"
              onClick={handleSaveRule}
            >
              Kaydet
            </Button>
          ]
        }
      >
        {modalMode === 'view' && selectedRule ? (
          <div className="rule-details">
            <div className="rule-details-header">
              <div>
                <h3>{selectedRule.name}</h3>
                <div className="rule-meta">
                  <Badge color="default">{selectedRule.type}</Badge>
                  {renderSeverityBadge(selectedRule.severity)}
                  <Badge color={selectedRule.enabled ? 'success' : 'default'}>
                    {selectedRule.enabled ? 'Etkin' : 'Devre Dışı'}
                  </Badge>
                </div>
              </div>
              <div className="rule-stats">
                <div>
                  <span className="stat-label">Oluşturulma:</span>
                  <span className="stat-value">{formatDate(selectedRule.createdAt)}</span>
                </div>
                <div>
                  <span className="stat-label">Güncelleme:</span>
                  <span className="stat-value">{formatDate(selectedRule.updatedAt)}</span>
                </div>
                <div>
                  <span className="stat-label">Versiyon:</span>
                  <span className="stat-value">{selectedRule.version}</span>
                </div>
                {selectedRule.lastTriggeredAt && (
                  <div>
                    <span className="stat-label">Son Tetiklenme:</span>
                    <span className="stat-value">{formatDate(selectedRule.lastTriggeredAt)}</span>
                  </div>
                )}
                <div>
                  <span className="stat-label">Tetiklenme Sayısı:</span>
                  <span className="stat-value">{selectedRule.triggerCount}</span>
                </div>
              </div>
            </div>
            
            <div className="rule-details-body">
              <div className="rule-description">
                <h4>Açıklama</h4>
                <p>{selectedRule.description || 'Açıklama yok'}</p>
              </div>
              
              <div className="rule-content">
                <h4>İçerik</h4>
                <pre>{selectedRule.content}</pre>
              </div>
              
              <div className="rule-tags">
                <h4>Etiketler</h4>
                <div className="tags-container">
                  {selectedRule.tags && selectedRule.tags.length > 0 ? (
                    selectedRule.tags.map((tag, index) => (
                      <Badge key={index} color="info" className="tag-badge">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="no-tags">Etiket yok</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rule-form">
            <div className="form-group">
              <label htmlFor="name">İsim *</label>
              <Input
                id="name"
                value={editedRule.name || ''}
                onChange={(e) => setEditedRule({ ...editedRule, name: e.target.value })}
                placeholder="Kural ismi girin"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Açıklama</label>
              <TextArea
                id="description"
                value={editedRule.description || ''}
                onChange={(e) => setEditedRule({ ...editedRule, description: e.target.value })}
                placeholder="Kural açıklaması girin"
                rows={3}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Tip *</label>
                <Select
                  id="type"
                  value={editedRule.type || 'custom'}
                  onChange={(value) => setEditedRule({ ...editedRule, type: value })}
                  options={[
                    { value: 'zeek', label: 'Zeek' },
                    { value: 'suricata', label: 'Suricata' },
                    { value: 'sigma', label: 'Sigma' },
                    { value: 'yara', label: 'YARA' },
                    { value: 'custom', label: 'Özel' }
                  ]}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Kategori</label>
                <Input
                  id="category"
                  value={editedRule.category || ''}
                  onChange={(e) => setEditedRule({ ...editedRule, category: e.target.value })}
                  placeholder="Kategori girin"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="severity">Önem *</label>
                <Select
                  id="severity"
                  value={editedRule.severity || 'medium'}
                  onChange={(value) => setEditedRule({ ...editedRule, severity: value })}
                  options={[
                    { value: 'critical', label: 'Kritik' },
                    { value: 'high', label: 'Yüksek' },
                    { value: 'medium', label: 'Orta' },
                    { value: 'low', label: 'Düşük' }
                  ]}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="content">İçerik *</label>
              <TextArea
                id="content"
                value={editedRule.content || ''}
                onChange={(e) => setEditedRule({ ...editedRule, content: e.target.value })}
                placeholder="Kural içeriğini girin"
                rows={10}
                className="rule-content-editor"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="tags">Etiketler</label>
              <Input
                id="tags"
                value={(editedRule.tags || []).join(', ')}
                onChange={(e) => setEditedRule({ 
                  ...editedRule, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
                })}
                placeholder="Etiketleri virgülle ayırarak girin"
              />
            </div>
            
            <div className="form-group checkbox-group">
              <Checkbox
                id="enabled"
                checked={editedRule.enabled || false}
                onChange={(e) => setEditedRule({ ...editedRule, enabled: e.target.checked })}
                label="Kuralı etkinleştir"
              />
            </div>
          </div>
        )}
      </Modal>
      
      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Onay"
        size="small"
        actions={[
          <Button key="cancel" onClick={() => setShowConfirmModal(false)}>
            İptal
          </Button>,
          <Button 
            key="confirm" 
            variant="danger"
            onClick={confirmAction}
          >
            Onayla
          </Button>
        ]}
      >
        <p>{confirmMessage}</p>
      </Modal>
      
      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Kuralları İçe Aktar"
        size="medium"
        actions={[
          <Button key="cancel" onClick={() => setShowImportModal(false)}>
            İptal
          </Button>,
          <Button 
            key="import" 
            variant="primary"
            onClick={handleImportSubmit}
            disabled={!importFile}
          >
            İçe Aktar
          </Button>
        ]}
      >
        <div className="import-modal-content">
          <p>
            JSON formatında kural dosyasını yükleyin. Dosya, kural nesnelerini içeren bir dizi olmalıdır.
          </p>
          
          <div className="file-upload">
            <input
              type="file"
              accept=".json"
              onChange={handleImportFileChange}
              id="rule-import-file"
            />
            <label htmlFor="rule-import-file">
              {importFile ? importFile.name : 'Dosya Seç'}
            </label>
          </div>
          
          {importError && (
            <Alert
              type="error"
              message={importError}
              className="import-error"
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default NDRRuleManager;