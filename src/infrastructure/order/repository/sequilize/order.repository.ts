import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";

export default class OrderRepository implements OrderRepositoryInterface{

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
  
  async find(id: string): Promise<Order | null> {

    try {
      const orderModel = await OrderModel.findByPk(id, {
        include: [{
            model: OrderItemModel,
            as: 'items', // This should match the alias used in the association
            attributes: ['id', 'name', 'price', 'product_id', 'quantity'] // Only fetch these fields
          }]
      });

      if (!orderModel) {
          return null;
      }

      // Create Item objects from fetched data
      const items = orderModel.items.map(item => new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity));

      // Create an Order object
      const order = new Order(orderModel.id, orderModel.customer_id, items);

      return order;

    } catch (error) {
      throw new Error("Order not found");
    }

  }
  
  async findAll(): Promise<Order[]> {
    const orderModels = await OrderModel.findAll({
      include: [{
          model: OrderItemModel,
          as: 'items', // This should match the alias used in the association
          attributes: ['id', 'name', 'price', 'product_id', 'quantity'] // Only fetch these fields
        }]
    });

    // Create Order objects from fetched data
    const orders = orderModels.map(orderModel => {
      const items = orderModel.items.map(item => new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity));
      return new Order(orderModel.id, orderModel.customer_id, items);
    });

    return orders;
  }

}
