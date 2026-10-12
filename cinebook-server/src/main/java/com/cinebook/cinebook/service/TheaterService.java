package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.TheaterDetailDTO;
import com.cinebook.cinebook.dto.TheaterRequest;
import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.Screen;
import com.cinebook.cinebook.model.Theater;
import com.cinebook.cinebook.repository.ScreenRepository;
import com.cinebook.cinebook.repository.TheaterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TheaterService {

    private final TheaterRepository theaterRepository;
    private final ScreenRepository screenRepository;
    private final ScreenService screenService;
    private final DtoMapper mapper;

    public List<TheaterDetailDTO> getAllTheaters() {
        return theaterRepository.findAllByOrderByNameAsc().stream()
                .map(t -> mapper.theater(t, screenRepository.countByTheaterId(t.getId())))
                .toList();
    }

    public TheaterDetailDTO getTheater(Long id) {
        Theater t = find(id);
        return mapper.theater(t, screenRepository.countByTheaterId(id));
    }

    public TheaterDetailDTO addTheater(TheaterRequest req) {
        Theater theater = new Theater();
        apply(theater, req);
        return mapper.theater(theaterRepository.save(theater), 0);
    }

    public TheaterDetailDTO updateTheater(Long id, TheaterRequest req) {
        Theater theater = find(id);
        apply(theater, req);
        theaterRepository.save(theater);
        return getTheater(id);
    }

    /** Deletes the theater and its screens; refused when any screen has showtimes. */
    @Transactional
    public void deleteTheater(Long id) {
        Theater theater = find(id);
        List<Screen> screens = screenRepository.findByTheaterIdOrderByScreenNameAsc(id);
        for (Screen s : screens) {
            screenService.deleteScreen(s.getId());
        }
        theaterRepository.delete(theater);
    }

    public Theater find(Long id) {
        return theaterRepository.findById(id).orElseThrow(() -> ApiException.notFound("Theater not found"));
    }

    private void apply(Theater t, TheaterRequest req) {
        t.setName(req.name().trim());
        t.setCity(req.city().trim());
        t.setAddress(req.address());
        t.setFacilities(req.facilities());
    }
}
