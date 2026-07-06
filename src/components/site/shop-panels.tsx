import { SearchDialog } from "@/components/site/search-dialog";
import { CartSheet } from "@/components/site/cart-sheet";
import { WishlistSheet } from "@/components/site/wishlist-sheet";
import { AccountSheet } from "@/components/site/account-sheet";

export function ShopPanels() {
  return (
    <>
      <SearchDialog />
      <CartSheet />
      <WishlistSheet />
      <AccountSheet />
    </>
  );
}
