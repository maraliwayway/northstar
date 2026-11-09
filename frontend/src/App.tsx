import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { Loading } from "./components/ui";
import { AuthProvider, useAuth } from "./lib/auth";
import Debt from "./pages/Debt";
import Income from "./pages/Income";
import Investing from "./pages/Investing";
import Login from "./pages/Login";
import NetWorth from "./pages/NetWorth";
import NorthStar from "./pages/NorthStar";
import Overview from "./pages/Overview";
import Paycheque from "./pages/Paycheque";
import Reset from "./pages/Reset";
import Review from "./pages/Review";
import Settings from "./pages/Settings";
import Spending from "./pages/Spending";

function Routed() {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!user) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="north-star" element={<NorthStar />} />
        <Route path="reset" element={<Reset />} />
        <Route path="spending" element={<Spending />} />
        <Route path="paycheque" element={<Paycheque />} />
        <Route path="income" element={<Income />} />
        <Route path="net-worth" element={<NetWorth />} />
        <Route path="debt" element={<Debt />} />
        <Route path="investing" element={<Investing />} />
        <Route path="review" element={<Review />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routed />
      </HashRouter>
    </AuthProvider>
  );
}
