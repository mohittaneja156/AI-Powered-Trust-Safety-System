import React from "react";
import {ProductProps} from "../../type";
import Image from "next/image";
import { HiShoppingCart } from "react-icons/hi";
import { FaHeart } from "react-icons/fa";
import FormattedPrice from "./FormattedPrice";
import { useDispatch } from "react-redux";
import { addToCart, addToFavorite } from "@/store/nextSlice";
import Link from "next/link";


const Products = ({productData} : any) =>{
    const dispatch = useDispatch();
    return(
        <div className="w-full px-2 md:px-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
            {productData.map(({id,
            title,
            price,
            description,
            category,
            image}:ProductProps) =>(
                <Link key={id} href={`/product/${id}`}>
                  <div className="w-full bg-white text-text_primary p-3 md:p-4 border border-gray-200
                    rounded-xl group overflow-hidden cursor-pointer flex flex-col shadow-sm hover:shadow-lg transition-all duration-300">
                        <div className="w-full h-48 md:h-[260px] relative flex items-center justify-center bg-gray_light rounded-lg">
                        <Image className="w-full h-full object-cover scale-90 hover:scale-100
                        transition-transform duration-300 rounded-lg" width={300} height={300} src={image} alt="productImg"/>
                        <div className="w-10 h-10 md:w-12 md:h-12 absolute bottom-16 md:bottom-20 right-0 border-[1px] 
                        border-gray-300 bg-white rounded-lg flex flex-col translate-x-16 md:translate-x-20 group-hover:translate-x-0
                        transition-transform duration-300 shadow-md">
                            <span onClick={e => {e.preventDefault(); dispatch(
                                addToCart({
                                    id : id,
                                    title:title,
                                    price:price,
                                    description:description,
                                    category:category,
                                    image:image,
                                    quantity:1,
                            })
                        )}} className="w-full h-full border-b-[1px] border-b-gray-300 flex items-center justify-center 
                            text-xl bg-transparent hover:bg-primary hover:text-white cursor-pointer duration-300 rounded-t-lg
                            "><HiShoppingCart/></span>
                            <span onClick={e => {e.preventDefault(); dispatch(
                                addToFavorite({
                                    id : id,
                                    title:title,
                                    price:price,
                                    description:description,
                                    category:category,
                                    image:image,
                                    quantity:1,
                            }) 
                        )}}className="w-full h-full border-b-[1px] border-b-gray-300 flex items-center justify-center 
                            text-xl bg-transparent hover:bg-secondary hover:text-white cursor-pointer duration-300 rounded-b-lg
                            "><FaHeart/></span>
                        </div>
                        </div>
                        <div className="px-2 md:px-4 py-2 md:py-3 flex flex-col gap-2">
                            <p className="text-xs text-text_secondary tracking-wide bg-gray_light px-2 py-1 rounded-full w-fit">{category}</p>
                            <p className="text-base font-semibold line-clamp-2 text-text_primary">{title}</p>
                            <p className="flex items-center">
                                <span className="text-primary font-bold text-lg">
                                    <FormattedPrice amount={price*10}/>
                                </span>
                            </p>
                            <p className="text-xs text-text_secondary text-justify line-clamp-3">
                                {description.substring(0,200)}
                            </p>
                            <button onClick={e => {e.preventDefault(); dispatch(
                                addToCart({
                                    id : id,
                                    title:title,
                                    price:price,
                                    description:description,
                                    category:category,
                                    image:image,
                                    quantity:1,
                            })
                        )}} className="h-10 font-medium bg-primary text-white rounded-lg hover:bg-primary_dark 
                            transition-colors duration-300 mt-2 w-full shadow-sm hover:shadow-md">Add to cart</button>
                        </div>
                    </div>
                </Link>
                ))}
        </div>

    );
};

export default Products;