/**
 * An interface for objects storing service time information
 *
 * Service timing information is encoded in the LTA API as a string that is either in HHMM format, or
 * the string "-", which indicates that the service does not operate at all during the given day or time period.
 */
interface ServiceTimeInformation {
    /**
     * The time of the first bus on weekdays, in HHMM format.
     */
    WD_FirstBus: String,
    /**
     * The time of the last bus on weekdays, in HHMM format.
     */
    WD_LastBus: String,
    /**
     * The time of the first bus on Saturdays, in HHMM format.
     */
    SAT_FirstBus: String,
    /**
     * the time of the last bus on Saturdays, in HHMM format.
     */
    SAT_LastBus: String,
    /**
     * The time of the first bus on Sundays, in HHMM format.
     */
    SUN_FirstBus: String,
    /**
     * The time of the last bus on Sundays, in HHMM format.
     */
    SUN_LastBus: String
}

export default ServiceTimeInformation;