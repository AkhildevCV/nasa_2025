import { motion } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';

export default function FeelRadial({ label, value, color }) {
  const spring = useSpring({ number: value, from: { number: 0 }, config: { tension: 120, friction: 14 } });

  return (
    <div className="feel-item">
      <animated.div className="feel-circle" style={{ '--val': spring.number, '--color': color }}>
        <animated.span>{spring.number.to((n) => `${Math.round(n)}%`)}</animated.span>
      </animated.div>
      <p>{label}</p>
    </div>
  );
}