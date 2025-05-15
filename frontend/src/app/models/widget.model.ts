export interface Widget {
  id: string;
  dashboardId: string;
  title: string;
  type: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config?: any;
  dataSource?: string;
  refreshInterval?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}