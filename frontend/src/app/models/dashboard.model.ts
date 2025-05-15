export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  layout?: any;
  userId?: string;
  shared?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Widget {
  id: string;
  title: string;
  type: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config?: any;
  dashboardId: string;
}