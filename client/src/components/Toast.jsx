import { motion, AnimatePresence } from 'motion/react';
import { LuCheck } from 'react-icons/lu';
import { useCart } from '../hooks/useCart';

// role="status" announces politely without stealing focus, which matters
// because the drawer opening already moves focus.
const Toast = () => {
    const { toast } = useCart();

    return (
        <AnimatePresence>
            {toast && (
                <motion.div
                    role="status"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 24 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed bottom-6 left-6 z-[60] flex items-center gap-2.5
                               px-4 py-3 rounded-xl bg-accent text-on-accent
                               text-sm font-medium shadow-lg"
                >
                    <LuCheck size={16} />
                    {toast}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Toast;
