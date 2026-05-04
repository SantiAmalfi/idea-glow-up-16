import { motion } from "framer-motion";

const WHATSAPP_NUMBER = "542227515092";
const WHATSAPP_MESSAGE = "Hola! Vengo de Project Evaluator y quiero más info.";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export default function WhatsAppButton() {
  return (
    <motion.a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 15 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-black/30 ring-1 ring-black/10"
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-20" />
      <svg
        viewBox="0 0 32 32"
        className="relative h-8 w-8"
        fill="#ffffff"
        aria-hidden="true"
      >
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.244-.703.244-1.075 0-.058 0-.143-.014-.2-.1-.172-2.434-1.39-2.692-1.39zm-2.91 7.747a8.32 8.32 0 0 1-4.66-1.418l-3.252.884.873-3.196a8.34 8.34 0 1 1 7.04 3.73zm0-18.272a9.93 9.93 0 0 0-9.928 9.926c0 1.7.43 3.36 1.247 4.832L4.366 28l5.732-1.55a9.92 9.92 0 0 0 4.768 1.222h.004A9.93 9.93 0 0 0 16.2 6.68z" />
      </svg>
    </motion.a>
  );
}
