import { configureStore } from '@reduxjs/toolkit'
import {modeSlice} from '@/store/modePayment/stateModePayment'
export const index = configureStore({
    reducer: {
        modePayment: modeSlice.reducer
    },
});


export type RootState = ReturnType<typeof index.getState>
