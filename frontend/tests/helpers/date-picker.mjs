export async function chooseDateTime(page, value, trigger = page.locator('#edit-goal-deadline')) {
  const [date, time] = value.split('T'), [year, month] = date.split('-'), [hour, minute] = time.split(':')
  await trigger.click()
  const calendar = page.getByRole('dialog', { name: '选择日期与时间' })
  await calendar.getByRole('button', { name: '切换年月' }).click()
  await calendar.getByRole('textbox', { name: '跳转年份' }).fill(year)
  await calendar.getByRole('button', { name: `查看${year}年${Number(month)}月`, exact: true }).click()
  await calendar.locator(`[data-date="${date}"]`).click()
  await calendar.getByRole('textbox', { name: '小时', exact: true }).fill(hour)
  await calendar.getByRole('textbox', { name: '分钟', exact: true }).fill(minute)
  await calendar.getByRole('button', { name: '选好时间' }).click()
  await calendar.waitFor({ state: 'detached' })
}
