import React from "react";
import {LuMenu} from "react-icons/lu";
import { useSelector, useDispatch } from "react-redux";
import { stateProps } from "../../../type";
import { signOut } from "next-auth/react";
import { removeUser } from "@/store/nextSlice";

const HeaderBottom = () =>{
    const { userInfo} = useSelector(
        (state:stateProps)=>state.next);
        const dispatch = useDispatch();
        const handleSignOut=()=>{
            signOut();
            dispatch(removeUser());
        }
    return (
        <div className="w-full h-auto min-h-10 bg-gray_light text-sm text-text_primary px-2 md:px-4 flex items-center overflow-x-auto gap-2 border-b border-gray-200">
            <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300 whitespace-nowrap font-medium">
                <LuMenu />All Categories
            </p>
            {/* Mobile: all links in scrollable row */}
            <div className="flex md:hidden flex-row gap-2 overflow-x-auto w-full">
                <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300 whitespace-nowrap">Today's Deals</p>
                <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300 whitespace-nowrap">New Arrivals</p>
                <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300 whitespace-nowrap">Best Sellers</p>
                <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300 whitespace-nowrap">Electronics</p>
                <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300 whitespace-nowrap">Fashion</p>
                <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300 whitespace-nowrap">Home & Garden</p>
                <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300 whitespace-nowrap">Sports</p>
                <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300 whitespace-nowrap">Books</p>
                <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300 whitespace-nowrap">Beauty</p>
                <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300 whitespace-nowrap">Toys</p>
                <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300 whitespace-nowrap">Customer Service</p>
            </div>
            {/* Desktop: original links */}
            <p className="hidden md:inline-flex flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300">Today's Deals</p>
            <p className="hidden md:inline-flex flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300">New Arrivals</p>
            <p className="hidden md:inline-flex flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300">Best Sellers</p>
            <p className="hidden md:inline-flex flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300">Electronics</p>
            <p className="hidden md:inline-flex flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300">Fashion</p>
            <p className="hidden md:inline-flex flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300">Home & Garden</p>
            <p className="hidden md:inline-flex flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300">Sports</p>
            <p className="hidden md:inline-flex flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300">Books</p>
            <p className="hidden md:inline-flex flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300">Beauty</p>
            <p className="hidden md:inline-flex flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300">Toys</p>
            <p className="hidden md:inline-flex flex items-center gap-1 h-8 px-2 border border-transparent hover:border-primary hover:text-primary cursor-pointer duration-300">Customer Service</p>
            {userInfo && (
                <button onClick={handleSignOut} className="ml-auto flex items-center gap-1 h-8 px-2 border border-transparent hover:border-red-600 hover:text-red-500 cursor-pointer duration-300 whitespace-nowrap">Sign Out</button>
            )}
        </div>
    );
};

export default HeaderBottom;