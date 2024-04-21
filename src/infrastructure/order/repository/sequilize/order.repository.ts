import Order from "../../../../domain/checkout/entity/order";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    // Update the order itself
    await OrderModel.update({
      customer_id: entity.customerId,
      total: await entity.total()
    }, {
      where: { id: entity.id }
    });
  
    // Update each item
    for (const item of entity.items) {
      await OrderItemModel.update({
        name: item.name,
        price: item.price,
        product_id: item.productId,
        quantity: item.quantity
      }, {
        where: { id: item.id, order_id: entity.id }
      });
    }
  }
  
}
