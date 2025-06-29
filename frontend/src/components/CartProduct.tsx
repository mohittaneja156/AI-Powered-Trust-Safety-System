import React from "react";
import Image from "next/image";
import FormattedPrice from "./FormattedPrice";
import { LuMinus, LuPlus } from "react-icons/lu";
import { IoMdClose } from "react-icons/io";
import { useDispatch } from "react-redux";
import {
  decreaseQuantity,
  deleteProduct,
  increaseQuantity,
} from "@/store/nextSlice";
interface Item{
    id:number;
    title:string;
    price: number;
    description:string;
    category:string;
    image:string;
    quantity: number;

}

interface cartProductProps{
    item:Item;
}

const CartProduct = ({ item }: cartProductProps) => {
    const dispatch = useDispatch();
    return (
      <div className="bg-gray_light rounded-lg flex items-center gap-4 p-4 border border-gray-200">
        <Image
          className="object-cover rounded-lg"
          width={150}
          height={150}
          src={item.image}
          alt="productImage"
        />
        <div className="flex items-center px-2 gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-primary">{item.title}</p>
            <p className="text-sm text-text_secondary">{item.description}</p>
            <p className="text-sm text-text_secondary">
              Unit Price{" "}
              <span className="font-semibold text-primary">
                <FormattedPrice amount={item.price*10} />
              </span>
            </p>
            <div className="flex items-center gap-6">
              <div className="flex items-center mt-1 justify-between border border-gray-300 px-4 py-1 rounded-full w-28 shadow-sm bg-white">
                <span
                  onClick={() =>
                    dispatch(
                      increaseQuantity({
                        id:item.id,
                        title:item.title,
                        price: item.price,
                        description:item.description,
                         category:item.category,
                        image:item.image,
                        quantity: 1,
                      })
                    )
                  }
                  className="w-6 h-6 flex items-center justify-center rounded-full text-base bg-transparent hover:bg-primary hover:text-white cursor-pointer transition-colors duration-200"
                >
                  <LuPlus />
                </span>
                <span className="font-medium">{item.quantity}</span>
                <span
                  onClick={() =>
                    dispatch(
                      decreaseQuantity({
                        id:item.id,
                        title:item.title,
                        price: item.price,
                        description:item.description,
                         category:item.category,
                        image:item.image,
                        quantity: 1,
                      })
                    )
                  }
                  className="w-6 h-6 flex items-center justify-center rounded-full text-base bg-transparent hover:bg-primary hover:text-white cursor-pointer transition-colors duration-200"
                >
                  <LuMinus />
                </span>
              </div>
              <div
                onClick={() => dispatch(deleteProduct(item.id))}
                className="flex items-center text-sm font-medium text-text_secondary hover:text-red-600 cursor-pointer duration-300"
              >
                <IoMdClose className="mt-[2px]" /> <p>remove</p>
              </div>
            </div>
          </div>
          <div className="text-lg font-semibold text-primary">
            <FormattedPrice amount={item.price * 10 * item.quantity} />
          </div>
        </div>
      </div>
    );
  };
  
  export default CartProduct;