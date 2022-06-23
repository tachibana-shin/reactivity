// import { computed, reactive, ref } from "@vue/reactivity"

import computed from "./computed"
import reactive from "./reactive"
import { ref } from "./ref"

const foo = ref(0)
const bar = ref(1)
const observed = reactive({ a: foo })
const dummy = computed(() => observed.a)

console.log(dummy.value)

// eslint-disable-next-line functional/immutable-data
observed.a = bar
console.log(dummy.value)
console.log(observed, dummy.value)
// expect(dummy.value).toBe(1)

// eslint-disable-next-line functional/immutable-data
bar.value++
// expect(dummy.value).toBe(2)
console.log(dummy.value)
