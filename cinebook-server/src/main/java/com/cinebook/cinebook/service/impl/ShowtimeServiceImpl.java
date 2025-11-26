//package com.cinebook.cinebook.service.impl;
//
//import com.cinebook.cinebook.dto.ShowtimeResponseDTO;
//import com.cinebook.cinebook.model.ShowTime;
//import com.cinebook.cinebook.repository.ShowTimeRepository;
//import com.cinebook.cinebook.service.ShowtimeService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//import java.time.LocalDate;
//import java.util.List;
//import java.util.stream.Collectors;
//
//@Service
//@RequiredArgsConstructor
//public class ShowtimeServiceImpl implements ShowtimeService {
//
//    private final ShowTimeRepository showTimeRepo;
//
//    @Override
//    public ShowTime createShowtime(ShowTime showTime) {
//        return showTimeRepo.save(showTime);
//    }
//
//    @Override
//    public List<ShowtimeResponseDTO> getShowtimesForMovieOnDate(Long movieId, LocalDate showDate) {
//        return showTimeRepo.findByMovieIdAndShowDate(movieId, showDate).stream()
//                .map(st -> ShowtimeResponseDTO.builder()
//                        .id(st.getId())
//                        .showDate(st.getShowDate())
//                        .startTime(st.getStartTime())
//                        .price(st.getPrice())
//                        .movieId(st.getMovie().getId())
//                        .screenId(st.getScreen().getId())
//                        .screenName(st.getScreen().getScreenName())
//                        .build())
//                .collect(Collectors.toList());
//    }
//
//    @Override
//    public List<ShowtimeResponseDTO> getShowtimesForScreenOnDate(Long screenId, LocalDate showDate) {
//        return showTimeRepo.findByScreenIdAndShowDate(screenId, showDate).stream()
//                .map(st -> ShowtimeResponseDTO.builder()
//                        .id(st.getId())
//                        .showDate(st.getShowDate())
//                        .startTime(st.getStartTime())
//                        .price(st.getPrice())
//                        .movieId(st.getMovie().getId())
//                        .screenId(st.getScreen().getId())
//                        .screenName(st.getScreen().getScreenName())
//                        .build())
//                .collect(Collectors.toList());
//    }
//}
