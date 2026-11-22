import type { Config } from "tailwindcss";
export default { content:["./src/**/*.{js,ts,jsx,tsx,mdx}"],theme:{extend:{
  colors:{ink:"#080b10",panel:"#101720",line:"#24303c",aqua:"#65e0cf",coral:"#ff806f"},
  boxShadow:{glow:"0 0 35px rgba(101,224,207,.12)"}
}},plugins:[]} satisfies Config;