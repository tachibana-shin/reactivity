// import { reactive, watch } from "vue"

import reactive from "./reactive"
import watch from "./watch"

const array = reactive({
  user: 1
})
watch(array, (value) => {
  console.log(value)
})
array.user++
