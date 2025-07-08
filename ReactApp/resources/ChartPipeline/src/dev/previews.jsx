import {ComponentPreview, Previews} from '@react-buddy/ide-toolbox'
import {PaletteTree} from './palette'
import ControlInstrumentsTable from "../components/tables/ControlInstrumentsTable.optimized";

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/ControlInstrumentsTable">
                <ControlInstrumentsTable/>
            </ComponentPreview>
        </Previews>
    )
}

export default ComponentPreviews