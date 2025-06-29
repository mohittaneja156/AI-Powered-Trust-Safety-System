import logo from "../../images/logo.png"
import Image from "next/image"
import cartIcon from "../../images/cart.png";
import { BiCaretDown } from "react-icons/bi";
import { HiOutlineSearch } from "react-icons/hi";
import { SlLocationPin } from "react-icons/sl";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { stateProps } from "../../../type";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { addUser } from "@/store/nextSlice";
import { FaBars, FaTimes } from "react-icons/fa";

const Header = () => {
    const { data: session } = useSession();
    const {productData,favoriteData, userInfo} = useSelector((state:stateProps)=>state.next);
    const dispatch = useDispatch();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    useEffect(()=>{
        if(session){
            dispatch(addUser({
                name:session?.user?.name,
                email:session?.user?.email,
                image:session?.user?.image,
            })
        );
        }
    },[session, dispatch]);
    return (
        <div className="w-full h-20 bg-white text-text_primary shadow-md sticky top-0 z-50 border-b border-gray-200">
            <div className="h-full w-full mx-auto flex flex-row items-center justify-between gap-1 px-2 md:px-4 overflow-x-hidden">
                {/* logo and hamburger */}
                <div className="flex items-center w-auto justify-between">
                    <Link href="/" className="px-2 border border-transparent hover:border-primary cursor-pointer duration-300 flex items-center justify-center h-[70%]">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">S</span>
                            </div>
                            <span className="text-xl font-bold text-primary">ShopHub</span>
                        </div>
                    </Link>
                    {/* Hamburger for mobile */}
                    <button className="md:hidden ml-2 text-2xl text-text_primary focus:outline-none" onClick={()=>setMobileNavOpen(!mobileNavOpen)}>
                        {mobileNavOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>
                {/* delivery (hide on mobile) */}
                <div className="px-2 border border-transparent hover:border-primary cursor-pointer duration-300 items-center justify-center h-[70%] hidden xl:inline-flex gap-1">
                    <SlLocationPin className="text-primary" />
                    <div className="text-xs">
                        <p className="text-text_secondary">Deliver to</p>
                        <p className="text-text_primary font-bold uppercase">Your Location</p>
                    </div>
                </div>
                {/* searchbar */}
                <div className="flex-1 h-10 flex items-center justify-between relative mx-2">
                    <input className="w-full h-full rounded-lg px-4 placeholder:text-sm text-base text-text_primary border border-gray-300 outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20" type="text" placeholder="Search for products..."/>
                    <span className="w-12 h-full bg-primary text-white text-2xl flex items-center justify-center absolute right-0 rounded-r-lg cursor-pointer hover:bg-primary_dark transition-colors duration-200">
                        <HiOutlineSearch/>
                    </span>
                </div>
                {/* Nav links - hidden on mobile, visible on md+ */}
                <div className="hidden md:flex flex-row gap-2 ml-2">
                    <Link href="/ProductIdentity" className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-primary font-semibold rounded-lg border border-blue-200 shadow-sm transition-colors duration-200 whitespace-nowrap text-xs md:text-sm">Product Identity</Link>
                    <Link href="/ProductListing" className="flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-accent font-semibold rounded-lg border border-green-200 shadow-sm transition-colors duration-200 whitespace-nowrap text-xs md:text-sm">Product Listing</Link>
                    <Link href="/AdminDashboard" className="flex items-center gap-2 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-secondary font-semibold rounded-lg border border-orange-200 shadow-sm transition-colors duration-200 whitespace-nowrap text-xs md:text-sm">Admin Dashboard</Link>
                    <Link href="/YourOrders" className="flex items-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 font-semibold rounded-lg border border-purple-200 shadow-sm transition-colors duration-200 whitespace-nowrap text-xs md:text-sm">Your Orders</Link>
                    <Link href="/cart" className="flex items-center px-2 border border-transparent hover:border-primary cursor-pointer duration-300 h-[70%] relative">
                        <div className="relative">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                                </svg>
                            </div>
                            <span className="absolute -top-2 -right-2 w-5 h-5 bg-secondary text-white text-xs rounded-full flex items-center justify-center font-bold">{productData ? productData.length : 0}</span>
                        </div>
                    </Link>
                </div>
                {/* signin and favorite - always visible, but stack on mobile */}
                <div className="flex items-center gap-2 ml-2">
                    {userInfo ? (
                        <div className="flex items-center px-2 border border-transparent hover:border-primary cursor-pointer duration-300 h-[70%] gap-1">
                            <Image src={userInfo.image} alt="userImage" className="w-8 h-8 rounded-full object-cover" width={32} height={32}/>
                            <div className="text-xs text-text_secondary flex flex-col justify-between">
                                <p className="text-text_primary font-bold">{userInfo.name}</p>
                                <p>{userInfo.email}</p>
                            </div>
                        </div>
                    ) : (
                        <div onClick={() => signIn()} className="text-xs text-text_secondary flex flex-col justify-center px-2 border border-transparent hover:border-primary cursor-pointer duration-300 h-[70%]">
                            <p>Hello, sign in</p>
                            <p className="text-text_primary font-bold flex">Account & Lists <span><BiCaretDown/></span></p>
                        </div>
                    )}
                    <div className="text-xs text-text_secondary flex flex-col justify-center px-2 border border-transparent hover:border-primary cursor-pointer duration-300 h-[70%] relative">
                        <p>Marked</p>
                        <p className="text-text_primary font-bold">& Favorites</p>
                        {favoriteData.length > 0 && (
                            <span className="absolute right-2 top-2 w-4 h-4 border-[1px] border-gray-400 flex items-center justify-center text-xs text-secondary">{favoriteData.length}</span>
                        )}
                    </div>
                </div>
            </div>
            {/* Mobile nav drawer */}
            {mobileNavOpen && (
                <div className="fixed top-20 left-0 w-full bg-white shadow-lg z-50 flex flex-col items-start px-4 py-4 gap-3 md:hidden animate-slide-in-right border-t border-gray-200">
                    <Link href="/ProductIdentity" className="w-full py-2 text-primary font-semibold border-b border-gray-100" onClick={()=>setMobileNavOpen(false)}>Product Identity</Link>
                    <Link href="/ProductListing" className="w-full py-2 text-accent font-semibold border-b border-gray-100" onClick={()=>setMobileNavOpen(false)}>Product Listing</Link>
                    <Link href="/AdminDashboard" className="w-full py-2 text-secondary font-semibold border-b border-gray-100" onClick={()=>setMobileNavOpen(false)}>Admin Dashboard</Link>
                    <Link href="/YourOrders" className="w-full py-2 text-purple-600 font-semibold border-b border-gray-100" onClick={()=>setMobileNavOpen(false)}>Your Orders</Link>
                    <Link href="/cart" className="w-full py-2 text-primary font-semibold border-b border-gray-100 flex items-center" onClick={()=>setMobileNavOpen(false)}>
                        <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center mr-2">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                            </svg>
                        </div>
                        Cart <span className="ml-2 text-secondary font-bold">{productData ? productData.length : 0}</span>
                    </Link>
                </div>
            )}
        </div>
    );
}

export default Header;