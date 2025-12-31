import { clsx } from "clsx";
import styles from "./Skeleton.module.scss";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
}

export const Skeleton = ({ width, height, circle, className }: SkeletonProps) => {
  return <div className={clsx(styles.skeleton, circle && styles.circle, className)} style={{ width, height }} />;
};
