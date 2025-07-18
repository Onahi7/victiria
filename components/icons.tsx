import type { LightbulbIcon as LucideProps } from "lucide-react"

export const Icons = {
  logo: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 4l-8 4l8 4l8 -4l-8 -4" />
      <path d="M12 12l-8 -4v8l8 4l8 -4v-8l-8 4" />
    </svg>
  ),
  godfluence: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 3a4 4 0 0 1 4 4a4 4 0 0 1 -4 4a4 4 0 0 1 -4 -4a4 4 0 0 1 4 -4" />
      <path d="M6 15a4 4 0 0 1 4 4a4 4 0 0 1 -4 4a4 4 0 0 1 -4 -4a4 4 0 0 1 4 -4" />
      <path d="M18 15a4 4 0 0 1 4 4a4 4 0 0 1 -4 4a4 4 0 0 1 -4 -4a4 4 0 0 1 4 -4" />
      <path d="M12 11v8" />
      <path d="M8 19h8" />
    </svg>
  ),
  dify: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-11a1 1 0 0 1 -1 -1v-14a1 1 0 0 1 1 -1" />
      <path d="M15 8h2" />
      <path d="M15 12h2" />
      <path d="M15 16h2" />
      <path d="M8 8h2" />
      <path d="M8 12h2" />
      <path d="M8 16h2" />
    </svg>
  ),
}

