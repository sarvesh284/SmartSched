export const useSlideIn = (delay = 0) => ({
  initial: { y: 20, opacity: 0 },
  whileInView: { y: 0, opacity: 1 },
  viewport: { once: true, margin: "-50px" },
  transition: { 
    type: "spring", 
    mass: 2, 
    stiffness: 50, 
    damping: 20,
    delay: delay 
  }
});

export const useButtonPress = () => ({
  whileTap: { scale: 0.98 },
  transition: {
    type: "spring",
    stiffness: 400,
    damping: 25
  }
});
