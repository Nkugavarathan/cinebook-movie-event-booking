package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.TheaterDetailDTO;
import com.cinebook.cinebook.model.Theater;
import java.util.List;

public interface TheaterService {
    List<Theater> listTheaters();
    TheaterDetailDTO getTheaterDetail(Long theaterId);
    Theater createTheater(Theater theater);
}
