import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import FooterSection from "./components/FooterSection";
import FloatingSupport from "./components/FloatingSupport";
import ChatBox from "./components/ChatBox";

function UserLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <FooterSection />
      <ChatBox />
      <FloatingSupport />
    </>
  );
}

export default UserLayout;