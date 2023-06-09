import {createSlice, PayloadAction} from '@reduxjs/toolkit'

export const modeSlice = createSlice({
    name: 'mode',
    initialState: {
        value: 0
    },
    reducers: {
        setMode: (state,{payload}: PayloadAction<number>) => {
            state.value = payload
        }
    }
})

const { actions, reducer } = modeSlice
const { setMode } = actions

export { setMode }
export default reducer