import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/orders")({
  component: function OrdersRedirect() {
    return <Navigate to="/profile" hash="orders" />;
  },
});
