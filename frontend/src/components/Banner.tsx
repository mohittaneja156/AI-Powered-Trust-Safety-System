import React from "react";
import { Carousel }  from 'react-responsive-carousel';
import sliderImg_1 from "../images/slider/slide1.jpg"
import sliderImg_2 from "../images/slider/slide2.jpg"
import sliderImg_3 from "../images/slider/slide3.jpg"
import sliderImg_4 from "../images/slider/slide4.jpg"
import sliderImg_5 from "../images/slider/slide5.jpg"
import sliderImg_6 from "../images/slider/slide6.jpg"
import sliderImg_7 from "../images/slider/slide7.jpg"
import sliderImg_8 from "../images/slider/slide8.jpg"
import Image from "next/image";

const Banner = () =>{
    return(
        <div className="relative">
             <Carousel 
                autoPlay 
                infiniteLoop 
                showStatus={false} 
                showIndicators={true} 
                interval={4000}
                showThumbs={false}
                className="rounded-lg overflow-hidden shadow-lg"
             >
                <div className="relative">
                    <Image priority src={sliderImg_1} alt="sliderImg" className="rounded-lg" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                        <div className="text-white ml-8 md:ml-16">
                            <h2 className="text-2xl md:text-4xl font-bold mb-2">Discover Amazing Products</h2>
                            <p className="text-lg md:text-xl">Shop the latest trends and best deals</p>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <Image src={sliderImg_2} alt="sliderImg" className="rounded-lg" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                        <div className="text-white ml-8 md:ml-16">
                            <h2 className="text-2xl md:text-4xl font-bold mb-2">Quality You Can Trust</h2>
                            <p className="text-lg md:text-xl">Premium products at competitive prices</p>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <Image src={sliderImg_3} alt="sliderImg" className="rounded-lg" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                        <div className="text-white ml-8 md:ml-16">
                            <h2 className="text-2xl md:text-4xl font-bold mb-2">Fast & Secure Delivery</h2>
                            <p className="text-lg md:text-xl">Get your orders delivered safely and quickly</p>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <Image src={sliderImg_4} alt="sliderImg" className="rounded-lg" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                        <div className="text-white ml-8 md:ml-16">
                            <h2 className="text-2xl md:text-4xl font-bold mb-2">24/7 Customer Support</h2>
                            <p className="text-lg md:text-xl">We're here to help you anytime</p>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <Image src={sliderImg_5} alt="sliderImg" className="rounded-lg" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                        <div className="text-white ml-8 md:ml-16">
                            <h2 className="text-2xl md:text-4xl font-bold mb-2">Exclusive Deals</h2>
                            <p className="text-lg md:text-xl">Limited time offers on premium products</p>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <Image src={sliderImg_6} alt="sliderImg" className="rounded-lg" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                        <div className="text-white ml-8 md:ml-16">
                            <h2 className="text-2xl md:text-4xl font-bold mb-2">Shop Smart</h2>
                            <p className="text-lg md:text-xl">Compare prices and find the best deals</p>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <Image src={sliderImg_7} alt="sliderImg" className="rounded-lg" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                        <div className="text-white ml-8 md:ml-16">
                            <h2 className="text-2xl md:text-4xl font-bold mb-2">Easy Returns</h2>
                            <p className="text-lg md:text-xl">Hassle-free returns and exchanges</p>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <Image src={sliderImg_8} alt="sliderImg" className="rounded-lg" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                        <div className="text-white ml-8 md:ml-16">
                            <h2 className="text-2xl md:text-4xl font-bold mb-2">Join Our Community</h2>
                            <p className="text-lg md:text-xl">Connect with millions of satisfied customers</p>
                        </div>
                    </div>
                </div>
               
            </Carousel>
            <div className="w-full h-40 bg-gradient-to-t from-gray_light to-transparent absolute bottom-0 z-20"></div>
        </div>
    );
   
};

export default Banner;