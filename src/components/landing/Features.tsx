import { motion } from "framer-motion";
import { Zap, Shield, Sparkles } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Experience blazing-fast performance that keeps you ahead of the competition.",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description:
      "Built with security at its core, protecting what matters most to you.",
  },
  {
    icon: Sparkles,
    title: "Beautifully Crafted",
    description:
      "Every detail is thoughtfully designed to create a delightful experience.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const Features = () => {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
            Why choose us?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We've built something special, and here's what makes it stand out.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group p-8 rounded-2xl bg-card shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors duration-300">
                <feature.icon className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-display text-xl text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
