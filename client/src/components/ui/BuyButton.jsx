import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useCreateCheckoutSessionMutation } from "@api/modules/paymentApi";


export default function BuyButton({ courseId }) {
    const [createCheckout, { isLoading }] = useCreateCheckoutSessionMutation();
    const { user } = useSelector((s) => s.auth);
    const navigate = useNavigate();
    const location = useLocation();
    
  const handleBuy = async () => {
    if (!user) {
        navigate("/auth/login", {
        state: { from: location.pathname }
        });
        return;
    }

    const res = await createCheckout(courseId).unwrap();
    window.location.href = res.url; // redirect to Stripe
    };

  return (
    <button disabled={isLoading} onClick={handleBuy}>
      {isLoading ? "Redirecting..." : "Buy now"}
    </button>
  );
}