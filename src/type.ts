export type OrderStatus = 'placed' | 'shipped' | 'out of delivery' | 'delivered';
export interface IOrder {
    orderId: string;
    userId: string;
    status: OrderStatus;
    updatedAt: Date;
}

export interface IUser {
    userId: string;
    fcmToken?: string;
    notificationPreferences: {
        push: boolean;
        email: boolean;
        sms: boolean;
    };
}