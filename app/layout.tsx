import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"三角洲行动 · 群星行动指南",description:"三角洲行动国服PC S11群星：干员档案、武器介绍、每日地图密码和全音区键盘口琴。",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body>{children}</body></html>}