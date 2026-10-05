// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 首页（`#/`）：Hero 搜索栏 + 本地收藏列表，未登录也可用。

import AppLayout from '@/components/AppLayout'
import Favorites from '@/components/Favorites'

export default function Home() {
  return (
    <AppLayout homeActive>
      <Favorites />
    </AppLayout>
  )
}
