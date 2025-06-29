import { resetCart } from "@/store/nextSlice";
import Link from "next/link";
import React from "react";
import { useDispatch } from "react-redux";
const SuccessPage = () => {
  const dispatch = useDispatch();
  return (
    <div className="flex flex-col gap-2 items-center justify-center py-20">
      <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl text-primary font-semibold text-center">
        Thank you for shopping with ShopHub!
      </h1>
      <p className="text-text_secondary text-center">Your order has been placed successfully.</p>
      <Link
        className="text-lg text-primary hover:underline underline-offset-4 decoration-[1px] hover:text-primary_dark transition-colors duration-300 mt-4"
        href={"/"}
        onClick={() => dispatch(resetCart())}
      >
        <p>Continue Shopping</p>
      </Link>
    </div>
  );
};

export default SuccessPage;