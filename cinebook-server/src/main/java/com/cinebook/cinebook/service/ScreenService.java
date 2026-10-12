package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.ScreenRequest;
import com.cinebook.cinebook.dto.ScreenWithSeatsDTO;
import com.cinebook.cinebook.dto.SeatDTO;
import com.cinebook.cinebook.dto.SeatLayoutDTO;
import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.model.Screen;
import com.cinebook.cinebook.model.Seat;
import com.cinebook.cinebook.model.SeatType;
import com.cinebook.cinebook.model.Theater;
import com.cinebook.cinebook.repository.ScreenRepository;
import com.cinebook.cinebook.repository.SeatRepository;
import com.cinebook.cinebook.repository.ShowTimeRepository;
import com.cinebook.cinebook.repository.TheaterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ScreenService {

    private final ScreenRepository screenRepository;
    private final TheaterRepository theaterRepository;
    private final SeatRepository seatRepository;
    private final ShowTimeRepository showTimeRepository;
    private final DtoMapper mapper;

    @Transactional(readOnly = true)
    public List<ScreenWithSeatsDTO> list(Long theaterId) {
        List<Screen> screens = theaterId == null
                ? screenRepository.findAll()
                : screenRepository.findByTheaterIdOrderByScreenNameAsc(theaterId);
        return screens.stream()
                .sorted(Comparator.comparing((Screen s) -> s.getTheater().getName()).thenComparing(Screen::getScreenName))
                .map(s -> toDto(s, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public ScreenWithSeatsDTO get(Long id) {
        return toDto(find(id), true);
    }

    @Transactional
    public ScreenWithSeatsDTO create(ScreenRequest req) {
        Theater theater = theaterRepository.findById(req.theaterId())
                .orElseThrow(() -> ApiException.notFound("Theater not found"));

        Screen screen = Screen.builder()
                .screenName(req.screenName().trim())
                .format(req.format())
                .rows(req.rows())
                .columns(req.columns())
                .theater(theater)
                .build();
        screen = screenRepository.save(screen);
        generateSeats(screen, req.seats());
        return toDto(screen, true);
    }

    /**
     * Renames the screen and repaints seat types / gaps. The grid size can only change while the
     * screen has no showtimes, because existing bookings point at specific seats.
     */
    @Transactional
    public ScreenWithSeatsDTO update(Long id, ScreenRequest req) {
        Screen screen = find(id);
        boolean resized = screen.getRows() != req.rows() || screen.getColumns() != req.columns();
        boolean hasShowtimes = showTimeRepository.existsByScreenId(id);

        if (resized && hasShowtimes) {
            throw ApiException.conflict(
                    "This screen already has showtimes, so its size can't change. You can still change seat types and gaps.");
        }
        if (!screen.getTheater().getId().equals(req.theaterId())) {
            if (hasShowtimes) {
                throw ApiException.conflict("This screen has showtimes and can't be moved to another theater.");
            }
            screen.setTheater(theaterRepository.findById(req.theaterId())
                    .orElseThrow(() -> ApiException.notFound("Theater not found")));
        }

        screen.setScreenName(req.screenName().trim());
        screen.setFormat(req.format());

        if (resized) {
            seatRepository.deleteByScreenId(id);
            seatRepository.flush();
            screen.setRows(req.rows());
            screen.setColumns(req.columns());
            screenRepository.save(screen);
            generateSeats(screen, req.seats());
        } else if (req.seats() != null) {
            Map<String, SeatLayoutDTO> layout = index(req.seats());
            List<Seat> seats = seatRepository.findByScreenIdOrderByRowNumberAscSeatNumberAsc(id);
            for (Seat seat : seats) {
                SeatLayoutDTO cell = layout.get(seat.getRowNumber() + ":" + seat.getSeatNumber());
                if (cell != null) {
                    seat.setType(cell.type() == null ? SeatType.STANDARD : cell.type());
                    seat.setActive(cell.active());
                }
            }
            seatRepository.saveAll(seats);
            screenRepository.save(screen);
        }
        return toDto(screen, true);
    }

    @Transactional
    public void deleteScreen(Long id) {
        Screen screen = find(id);
        if (showTimeRepository.existsByScreenId(id)) {
            throw ApiException.conflict(
                    "Screen \"" + screen.getScreenName() + "\" has showtimes. Delete its showtimes first.");
        }
        seatRepository.deleteByScreenId(id);
        screenRepository.delete(screen);
    }

    public Screen find(Long id) {
        return screenRepository.findById(id).orElseThrow(() -> ApiException.notFound("Screen not found"));
    }

    private void generateSeats(Screen screen, List<SeatLayoutDTO> cells) {
        Map<String, SeatLayoutDTO> layout = index(cells);
        List<Seat> seats = new ArrayList<>();
        for (int row = 1; row <= screen.getRows(); row++) {
            for (int col = 1; col <= screen.getColumns(); col++) {
                SeatLayoutDTO cell = layout.get(row + ":" + col);
                seats.add(Seat.builder()
                        .rowNumber(row)
                        .seatNumber(col)
                        .type(cell == null || cell.type() == null ? SeatType.STANDARD : cell.type())
                        .active(cell == null || cell.active())
                        .screen(screen)
                        .build());
            }
        }
        seatRepository.saveAll(seats);
    }

    private static Map<String, SeatLayoutDTO> index(List<SeatLayoutDTO> cells) {
        Map<String, SeatLayoutDTO> map = new HashMap<>();
        if (cells != null) {
            for (SeatLayoutDTO c : cells) map.put(c.row() + ":" + c.col(), c);
        }
        return map;
    }

    private ScreenWithSeatsDTO toDto(Screen s, boolean withSeats) {
        List<SeatDTO> seats = withSeats
                ? seatRepository.findByScreenIdOrderByRowNumberAscSeatNumberAsc(s.getId()).stream()
                    .map(seat -> mapper.seat(seat, null, null)).toList()
                : List.of();
        return new ScreenWithSeatsDTO(s.getId(), s.getScreenName(), s.getFormat(), s.getRows(), s.getColumns(),
                s.getTheater().getId(), s.getTheater().getName(), s.getTheater().getCity(),
                seatRepository.countActiveByScreenId(s.getId()),
                showTimeRepository.existsByScreenId(s.getId()),
                seats);
    }
}
