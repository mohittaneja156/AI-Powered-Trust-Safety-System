import { resetCart } from "@/store/nextSlice";
import { useDispatch } from "react-redux";

const ResetCart = () => {
  const dispatch = useDispatch();
  const handleResetCart = () => {
    const confirmReset = window.confirm(
      "Are you sure to delete all items from your cart?"
    );
    if (confirmReset) {
      dispatch(resetCart());
    }
  };
  return (
    <button
      onClick={handleResetCart}
      className="w-44 h-10 font-semibold bg-gray-200 text-text_primary rounded-lg hover:bg-red-600 hover:text-white transition-colors duration-200 shadow-sm"
    >
      Reset Cart
    </button>
  );
};

export default ResetCart;