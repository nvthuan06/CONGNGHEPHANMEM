// backend/src/orders/dto/order.dto.ts
import { IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { OrderItemDto } from "./orderItem.dto.js";

export class OrderDto {
    @IsArray()
    @ValidateNested({ each : true})
    @Type(function () { return OrderItemDto; })
    items: OrderItemDto[];
}