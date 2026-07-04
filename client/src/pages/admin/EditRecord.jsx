import { useParams } from 'react-router-dom'
import DoctorRecordForm from './forms/DoctorRecordForm'
import PatientRecordForm from './forms/PatientRecordForm'
import AppointmentRecordForm from './forms/AppointmentRecordForm'

export default function EditRecord() {
    const { table, id } = useParams()

    if (table === 'doctors')      return <DoctorRecordForm id={id} />
    if (table === 'patients')     return <PatientRecordForm id={id} />
    if (table === 'appointments') return <AppointmentRecordForm id={id} />

    return (
        <main className="container">
            <p>Неизвестный тип записи</p>
        </main>
    )
}
