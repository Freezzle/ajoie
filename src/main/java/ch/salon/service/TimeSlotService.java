package ch.salon.service;

import ch.salon.repository.TimeSlotRepository;
import ch.salon.service.dto.TimeSlotDTO;
import ch.salon.service.mapper.TimeSlotMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class TimeSlotService {

    private final TimeSlotRepository timeSlotRepository;

    public TimeSlotService(TimeSlotRepository timeSlotRepository) {
        this.timeSlotRepository = timeSlotRepository;
    }

    public Map<LocalDate, List<TimeSlotDTO>> getTimeSlotsBySalon(UUID idSalon) {
        return timeSlotRepository.findBySalon_Id_OrderByStart(idSalon).stream().map(TimeSlotMapper.INSTANCE::toDto)
                                 .collect(Collectors.groupingBy(TimeSlotDTO::getDate, Collectors.toList()));
    }
}
