// 开源项目，未经作者同意，不得以抄袭/复制代码/修改源代码版权信息。
// 分类视图（`#/nav`，`?id=` 指定分类）：置顶快捷方式 + 二级分类页签 + 网站卡片。

import { useNavStore } from '@/store/useNavStore'
import { useModalStore } from '@/store/useModalStore'
import { useCurrentClass } from '@/lib/currentClass'
import AppLayout from '@/components/AppLayout'
import PinnedList from '@/components/PinnedList'
import ClassTabs from '@/components/ClassTabs'
import WebGroups from '@/components/WebGroups'

export default function Nav() {
  const isLogin = useNavStore((s) => s.isLogin)
  const openEditClass = useModalStore((s) => s.openEditClass)
  const { currentOne, currentTwo } = useCurrentClass()

  const groups = currentTwo?.nav || []

  return (
    <AppLayout
      currentOneId={currentOne?.id}
      currentTwoId={currentTwo?.id}
      defaultParentId={groups[0]?.id}
    >
      <PinnedList />
      {groups.length > 0 && (
        <ClassTabs
          groups={groups}
          isLogin={isLogin}
          onAdd={() => openEditClass({ cls: null, level: 3, parentId: currentTwo?.id })}
        />
      )}
      <WebGroups groups={groups} />
    </AppLayout>
  )
}
