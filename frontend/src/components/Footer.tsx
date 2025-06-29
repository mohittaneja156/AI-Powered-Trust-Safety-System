import React from "react";

const Footer =() =>{
    return (
    <div className="w-full h-auto min-h-20 bg-dark text-gray-300 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 py-4 md:py-0 px-2 text-center text-xs md:text-sm">
        <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-lg font-bold text-white">ShopHub</span>
        </div>
        <p className="mt-2 md:mt-0">All rights reserved {"ShopHub Ecommerce Platform 2025"}</p>
    </div>
    );
};

export default Footer;