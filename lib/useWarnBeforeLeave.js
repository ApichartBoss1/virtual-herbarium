import { useEffect } from "react";

/*
 * เตือนก่อนปิดหรือรีเฟรชหน้าระหว่างที่งานยังไม่เสร็จ
 * linkMessage: ถ้ามี จะถามยืนยันก่อนกดลิงก์ภายในเว็บด้วย
 * (ดักใน capture phase ก่อนที่ next/link จะเปลี่ยนหน้า)
 */
export function useWarnBeforeLeave(active, linkMessage = null) {
  useEffect(() => {
    if (!active) {
      return;
    }

    function handleBeforeUnload(event) {
      event.preventDefault();

      event.returnValue = "";
    }

    function handleLinkClick(event) {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link = event.target.closest?.("a[href]");

      if (!link || link.target === "_blank" || link.hasAttribute("download")) {
        return;
      }

      if (!window.confirm(linkMessage)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    if (linkMessage) {
      document.addEventListener("click", handleLinkClick, true);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [active, linkMessage]);
}
